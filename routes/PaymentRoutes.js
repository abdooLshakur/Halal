const express = require('express');
const router = express.Router();
const {
  initiateBankTransfer,
  verifyTransaction,
} = require('../controllers/PaymentController');
router.post("/bank9ja/initiate", initiateBankTransfer);
router.get('/paystack/verify/:reference', verifyTransaction);

module.exports = router;
