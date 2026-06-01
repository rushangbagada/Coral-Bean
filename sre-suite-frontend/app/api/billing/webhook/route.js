import { NextResponse } from 'next/server';
import paymentService from '@/services/paymentService';

export async function POST(req) {
  try {
    const signature = req.headers.get('stripe-signature') || '';
    const body = await req.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const event = await paymentService.handleWebhook(body, signature, webhookSecret);

    // In a real app you would update user subscription records here
    console.log('📬 Received billing webhook event:', event.type || event);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('❌ Billing webhook error:', err.message || err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 400 });
  }
}
