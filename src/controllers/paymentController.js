const paymentService = require("../services/paymentService");

exports.createPayment = async (req, res) => {
  try {
    const { amount } = req.body;

    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        message: "Idempotency key required",
      });
    }

    const payment = await paymentService.createPayment({
      amount,
      idempotencyKey,
    });

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const payment = await paymentService.getPayment(
      req.params.id
    );

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.processPayment = async (req, res) => {
  try {

    const payment =
      await paymentService.processPayment(
        req.params.id
      );

    res.json({
      success: true,
      payment,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

exports.webhook = async (req, res) => {

  try {

    const result =
      await paymentService.handleWebhook(
        req.body
      );

    res.json({
      success: true,
      result,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};