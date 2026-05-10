const pool = require("../config/db");

const { v4: uuidv4 } = require("uuid");

const {
  simulateGateway,
} = require("../utils/gatewaySimulator");

exports.createPayment = async ({
  amount,
  idempotencyKey,
}) => {

  // CHECK EXISTING PAYMENT

  const [existing] = await pool.query(
    `
    SELECT * FROM payments
    WHERE idempotency_key = ?
    `,
    [idempotencyKey]
  );

  if (existing.length > 0) {
    return existing[0];
  }

  const paymentId = uuidv4();

  await pool.query(
    `
    INSERT INTO payments
    (
      payment_id,
      idempotency_key,
      amount,
      status
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      paymentId,
      idempotencyKey,
      amount,
      "PENDING",
    ]
  );

  const [payment] = await pool.query(
    `
    SELECT * FROM payments
    WHERE payment_id = ?
    `,
    [paymentId]
  );

  return payment[0];
};

exports.getPayment = async (id) => {

  const [payment] = await pool.query(
    `
    SELECT * FROM payments
    WHERE payment_id = ?
    `,
    [id]
  );

  return payment[0];
};

exports.processPayment = async (
  paymentId
) => {

  const connection =
    await pool.getConnection();

  try {

    await connection.beginTransaction();

    // LOCK ROW

    const [payments] =
      await connection.query(
        `
        SELECT * FROM payments
        WHERE payment_id = ?
        FOR UPDATE
        `,
        [paymentId]
      );

    if (payments.length === 0) {
      throw new Error("Payment not found");
    }

    const payment = payments[0];

    // ALREADY SUCCESS

    if (payment.status === "SUCCESS") {

      await connection.commit();

      return payment;
    }

    // UPDATE PROCESSING

    await connection.query(
      `
      UPDATE payments
      SET status = 'PROCESSING'
      WHERE payment_id = ?
      `,
      [paymentId]
    );

    await connection.commit();

    // CALL GATEWAY

    const gatewayResponse =
      await simulateGateway();

    // SUCCESS

    if (
      gatewayResponse.status ===
      "SUCCESS"
    ) {

      await pool.query(
        `
        UPDATE payments
        SET
          status = 'SUCCESS',
          gateway_transaction_id = ?
        WHERE payment_id = ?
        `,
        [
          gatewayResponse.gatewayTransactionId,
          paymentId,
        ]
      );
    }

    // FAILED

    if (
      gatewayResponse.status ===
      "FAILED"
    ) {

      await pool.query(
        `
        UPDATE payments
        SET status = 'FAILED'
        WHERE payment_id = ?
        `,
        [paymentId]
      );
    }

    const [updated] = await pool.query(
      `
      SELECT * FROM payments
      WHERE payment_id = ?
      `,
      [paymentId]
    );

    return updated[0];

  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};

exports.retryPayment = async (
  paymentId,
  retryCount = 0
) => {

  const MAX_RETRY = 3;

  try {

    return await exports.processPayment(
      paymentId
    );

  } catch (error) {

    if (
      error.message ===
      "Gateway timeout"
    ) {

      if (retryCount >= MAX_RETRY) {

        await pool.query(
          `
          UPDATE payments
          SET status = 'FAILED'
          WHERE payment_id = ?
          `,
          [paymentId]
        );

        throw new Error(
          "Retry exhausted"
        );
      }

      const delay =
        2000 *
        Math.pow(2, retryCount);

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );

      return exports.retryPayment(
        paymentId,
        retryCount + 1
      );
    }

    throw error;
  }
};

exports.handleWebhook = async (
  payload
) => {

  const {
    payment_id,
    status,
  } = payload;

  const [payments] = await pool.query(
    `
    SELECT * FROM payments
    WHERE payment_id = ?
    `,
    [payment_id]
  );

  if (payments.length === 0) {
    throw new Error("Payment not found");
  }

  const payment = payments[0];

  // NEVER DOWNGRADE SUCCESS

  if (
    payment.status === "SUCCESS" &&
    status === "FAILED"
  ) {

    return {
      ignored: true,
    };
  }

  await pool.query(
    `
    UPDATE payments
    SET status = ?
    WHERE payment_id = ?
    `,
    [status, payment_id]
  );

  return {
    updated: true,
  };
};