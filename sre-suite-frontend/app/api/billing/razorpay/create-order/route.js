import { NextResponse } from 'next/server';
import rzService from '@/services/razorpayService';

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount = 1, currency = 'INR', receipt, notes } = body;
    const order = await rzService.createOrder({ amount, currency, receipt, notes });
    return NextResponse.json({ success: true, order, keyId: rzService.keyId || null });
  } catch (err) {
    console.error('❌ Razorpay create-order failed:', err.message || err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
