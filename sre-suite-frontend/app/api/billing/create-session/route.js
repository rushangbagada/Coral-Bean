import { NextResponse } from 'next/server';
import paymentService from '@/services/paymentService';

export async function POST(req) {
  try {
    const body = await req.json();
    const { priceId, successUrl, cancelUrl, email } = body;
    if (!priceId || !successUrl) {
      return NextResponse.json({ error: 'Missing priceId or successUrl' }, { status: 400 });
    }

    const session = await paymentService.createCheckoutSession({ priceId, successUrl, cancelUrl, customerEmail: email });
    return NextResponse.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('❌ /api/billing/create-session failed:', err.message || err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
