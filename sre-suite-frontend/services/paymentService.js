const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_KEY || '';
const isLiveStripe = stripeKey && stripeKey !== '' && stripeKey !== 'your_stripe_key';

let stripe = null;
if (isLiveStripe) {
  stripe = new Stripe(stripeKey, { apiVersion: '2022-11-15' });
  console.log('💳 [Payment Service] Stripe client initialized');
} else {
  console.log('💳 [Payment Service] Stripe disabled - using mock payment flow');
}

async function createCheckoutSession({ priceId, successUrl, cancelUrl, customerEmail }) {
  if (isLiveStripe && stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined
    });
    return { url: session.url, id: session.id };
  }

  // Mock session
  const mockId = `mock_${Date.now()}`;
  const mockUrl = `${successUrl}?session_id=${mockId}`;
  return { url: mockUrl, id: mockId };
}

async function handleWebhook(body, signature, webhookSecret) {
  if (isLiveStripe && stripe && webhookSecret) {
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      throw new Error('Webhook signature verification failed');
    }
    return event;
  }

  // In mock mode, simply parse body and return it
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    return parsed;
  } catch (err) {
    return { received: true };
  }
}

module.exports = { createCheckoutSession, handleWebhook };
