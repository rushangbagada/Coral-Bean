import { NextResponse } from 'next/server';
import { verifyWebhook } from '@/services/razorpayService';

export async function POST(req) {
  try {
    const signature = req.headers.get('x-razorpay-signature') || '';
    const body = await req.text();
    const res = verifyWebhook(body, signature);
    if (!res.verified) {
      console.warn('⚠️ Razorpay webhook verification failed', res);
      return NextResponse.json({ error: 'verification_failed' }, { status: 400 });
    }

    // Process webhook payload (mock: log it)
    const payload = JSON.parse(body || '{}');
    console.log('📬 Razorpay webhook received:', payload.event || payload);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('❌ Razorpay webhook error:', err.message || err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 400 });
  }
}
