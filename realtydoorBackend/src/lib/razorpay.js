const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createOrder(amountInPaise, receipt, notes = {}) {
  return razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    notes,
  });
}

async function createEscrowOrder(amountInPaise, receipt) {
  return razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    transfers: [
      {
        account: process.env.RAZORPAY_ROUTE_ACCOUNT_ID,
        amount: amountInPaise,
        currency: 'INR',
        on_hold: true,
      },
    ],
  });
}

async function releaseEscrow(paymentId, sellerAccountId, releaseAmountInPaise) {
  return razorpay.payments.transfer(paymentId, {
    transfers: [
      {
        account: sellerAccountId,
        amount: releaseAmountInPaise,
        currency: 'INR',
        on_hold: false,
      },
    ],
  });
}

async function refundPayment(paymentId, amountInPaise) {
  return razorpay.payments.refund(paymentId, { amount: amountInPaise });
}

function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

module.exports = {
  razorpay,
  createOrder,
  createEscrowOrder,
  releaseEscrow,
  refundPayment,
  verifyWebhookSignature,
  verifyPaymentSignature,
};
