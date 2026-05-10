exports.simulateGateway = async () => {

  await new Promise((resolve) =>
    setTimeout(resolve, 3000)
  );

  const rand = Math.random();

  // SUCCESS
  if (rand < 0.6) {
    return {
      status: "SUCCESS",
      gatewayTransactionId:
        "txn_" + Date.now(),
    };
  }

  // FAILED
  if (rand < 0.8) {
    return {
      status: "FAILED",
    };
  }

  // TIMEOUT
  throw new Error("Gateway timeout");
};