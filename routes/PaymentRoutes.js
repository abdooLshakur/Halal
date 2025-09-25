const express = require('express');
const router = express.Router();
const {
  initiateBank9jaPayment,
  verifyBank9jaPayment,
} = require('../controllers/PaymentController');
router.post("/bank9ja/initiate", initiateBank9jaPayment);
router.get('/paystack/verify/:reference', verifyBank9jaPayment);

module.exports = router;
