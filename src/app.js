const express = require("express");

const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(express.json());

app.use("/payments", paymentRoutes);

module.exports = app;