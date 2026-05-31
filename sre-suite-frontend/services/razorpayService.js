const Razorpay = require('razorpay');
const crypto = require('crypto');

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const isLiveRz = keyId && keySecret && keyId !== 'your_razorpay_key' && keySecret !== 'your_razorpay_secret';

let rz = null;
if (isLiveRz) {
  rz = new Razorpay({ key_id: keyId, key_secret: keySecret });
  console.log('💠 [Razorpay] Client initialized');
} else {
  console.log('💠 [Razorpay] Running in mock mode (no live keys)');
}

async function createOrder({ amount, currency = 'INR', receipt = `rcpt_${Date.now()}`, notes = {} }) {
  // Razorpay expects amount in smallest currency unit (e.g., paise)
  const amt = Math.round((Number(amount) || 0) * 100);
  if (isLiveRz && rz) {
    const options = { amount: amt, currency, receipt, payment_capture: 1, notes };
    const order = await rz.orders.create(options);
    return { order_id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt };
  }

  // Mock order
  const mockId = `order_mock_${Date.now()}`;
  return { order_id: mockId, amount: amt, currency, receipt };
}

function verifyWebhook(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  if (!secret) {
    // In mock mode, accept anything
    return { verified: true, reason: 'no webhook secret configured (mock)' };
  }

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const verified = expected === signature;
  return { verified, expected, signature };
}

module.exports = { createOrder, verifyWebhook, isLiveRz, keyId };
