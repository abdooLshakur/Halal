const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');

router.post("/bank9ja/initiate", paymentController.initiateBank9jaPayment);
router.get('/paystack/verify/:reference', paymentController.verifyTransaction);

module.exports = router;
