const paystack = require('../utils/PayStackClient');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/PaymentModal');

exports.initiateBankTransfer = async (req, res) => {
  const { email, amount } = req.body;
  const amountInKobo = amount * 100;

  try {
    const response = await paystack.post('/transaction/initialize', {
      email,
      amount: amountInKobo,
      callback_url: 'https://www.halalmatchmakings.com//payment/callback',
      channels: ['bank'],
      metadata: {
        custom_fields: [
          {
            display_name: 'Payment for order',
            variable_name: 'order_id',
            value: uuidv4(),
          },
        ],
      },
    });

    if (response.data.status) {
      // Save payment record as pending
      await Payment.create({
        email,
        amount,
        reference: response.data.data.reference,
        status: 'pending',
      });

      return res.json({
        status: 'success',
        authorization_url: response.data.data.authorization_url,
        access_code: response.data.data.access_code,
        reference: response.data.data.reference,
      });
    } else {
      return res.status(400).json({ status: 'failed', message: 'Failed to initialize transaction' });
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
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

exports.handleWebhook = async (req, res) => {
  const crypto = require('crypto');
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto.createHmac('sha512', secret).update(req.body).digest('hex');
  const signature = req.headers['x-paystack-signature'];
  if (hash !== signature) {
    return res.status(400).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());
  const { event: eventType, data } = event;

  if (eventType === 'charge.success') {
    const reference = data.reference;
    const amount = data.amount / 100;
    const customerEmail = data.customer.email;

    console.log(`✅ Payment successful for ${customerEmail} — ₦${amount} | Ref: ${reference}`);

    // Update payment status to success
    await Payment.findOneAndUpdate({ reference }, { status: 'success' });
  }

  res.sendStatus(200);
};
