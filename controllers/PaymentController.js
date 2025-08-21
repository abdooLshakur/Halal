const bank9jaRequest = require('../utils/PayStackClient');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/PaymentModal');

exports.initiateBank9jaPayment = async (req, res) => {
  const { email, name, amount } = req.body;

  // ✅ Unique reference between 18-25 chars
  const merchantReference = uuidv4().replace(/-/g, "").slice(0, 20);

  try {
    const response = await bank9jaRequest("post", "/initiate-payment", {
      amount,
      customer: { email, name },
      merchantReference,
      callbackUrl: "http://localhost:3000/payment/callback", // Change for prod
      description: "Halal Match Profile Activation",
    });

    const data = response.data.data;

    // Save pending payment
    await Payment.create({
      email,
      amount,
      reference: merchantReference,
      status: "pending",
    });

    res.json({
      status: "success",
      payment_link: data.link,
      reference: merchantReference,
    });
  } catch (err) {
    console.error("Bank9ja Payment Error:", err.response?.data || err.message);
    res
      .status(500)
      .json({ status: "error", message: "Payment initiation failed" });
  }
};

exports.verifyBank9jaPayment = async (req, res) => {
  const { reference } = req.params;

  try {
    const response = await bank9jaRequest(
      "get",
      `/verify-payment?reference=${reference}`
    );

    const paymentData = response.data.data;

    if (paymentData.status === "SUCCESS") {
      await Payment.findOneAndUpdate(
        { reference },
        { status: "success" }
      );
      return res.json({ status: "success", data: paymentData });
    } else {
      await Payment.findOneAndUpdate(
        { reference },
        { status: "failed" }
      );
      return res.status(400).json({ status: "failed", message: "Payment not successful" });
    }
  } catch (err) {
    console.error("Bank9ja Verify Error:", err.response?.data || err.message);
    res.status(500).json({ status: "error", message: "Error verifying payment" });
  }
};

exports.verifyTransaction = async (req, res) => {
  const { reference } = req.params;

  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);

    if (response.data.status && response.data.data.status === 'success') {
      // Update payment status to success
      await Payment.findOneAndUpdate({ reference }, { status: 'success' });

      return res.json({ status: 'success', data: response.data.data });
    } else {
      // Update payment status to failed or pending
      await Payment.findOneAndUpdate({ reference }, { status: 'failed' });

      return res.status(400).json({ status: 'failed', message: 'Payment not successful' });
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ status: 'error', message: 'Error verifying transaction' });
  }
};

exports.handleBank9jaWebhook = async (req, res) => {
  const crypto = require("crypto");

  const { amount, merchantReference, senderAccountNo, sessionId } = req.body;
  const rawString =
    process.env.BANK9JA_WEBHOOK_SECRET +
    parseFloat(amount).toFixed(2) +
    merchantReference +
    senderAccountNo +
    sessionId;

  const hash = crypto.createHash("sha512").update(rawString).digest("hex");

  if (hash !== req.headers["hash"]) {
    return res.status(400).json({ code: "99", message: "Invalid signature" });
  }

  // ✅ Verify payment before marking as success
  const verifyRes = await bank9jaRequest(
    "get",
    `/verify-payment?reference=${merchantReference}`
  );

  if (verifyRes.data.data.status === "SUCCESS") {
    await Payment.findOneAndUpdate({ reference: merchantReference }, { status: "success" });
  }

  res.json({ code: "00", message: "Webhook received" });
};
