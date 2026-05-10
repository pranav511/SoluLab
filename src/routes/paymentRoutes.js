const express = require("express");

const router = express.Router();

const paymentController = require("../controllers/paymentController");

router.post("/", paymentController.createPayment);

router.post("/:id/process", paymentController.processPayment);

router.get("/:id", paymentController.getPayment);

router.post("/webhook", paymentController.webhook);

module.exports = router;