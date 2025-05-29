const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');

router.post('/paystack/initiate', paymentController.initiateBankTransfer);
router.get('/paystack/verify/:reference', paymentController.verifyTransaction);

module.exports = router;
