'use client';

import { useState, useEffect } from 'react';

export default function BillingPage() {
  const [plan, setPlan] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const p = localStorage.getItem('sre_plan') || 'basic';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlan(p);
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    setMessage('');
    try {
      // Default to Stripe path
      const res = await fetch('/api/billing/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: 'price_premium_monthly',
          successUrl: window.location.origin + '/billing?session=success',
          cancelUrl: window.location.origin + '/billing?session=cancel'
        })
      });

      const data = await res.json();
      if (data && data.url) {
        if (data.url.includes('session_id=mock')) {
          localStorage.setItem('sre_plan', 'premium');
          setPlan('premium');
          setMessage('Upgrade successful — Premium enabled (mock).');
        } else {
          window.location.href = data.url;
        }
      } else {
        setMessage('Failed to create checkout session.');
      }
    } catch (err) {
      setMessage('Payment error: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpay = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/billing/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1, currency: 'INR' })
      });
      const data = await res.json();
      if (data && data.success && data.order) {
        // Mock flow: set plan directly
        if (data.order.order_id && data.order.order_id.startsWith('order_mock')) {
          localStorage.setItem('sre_plan', 'premium');
          setPlan('premium');
          setMessage('Razorpay mock payment successful — Premium enabled.');
        } else {
          // In a real flow, we'd open Razorpay Checkout with keyId and order_id
          setMessage('Razorpay order created: ' + data.order.order_id);
        }
      } else {
        setMessage('Failed to create Razorpay order');
      }
    } catch (err) {
      setMessage('Razorpay error: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = () => {
    localStorage.setItem('sre_plan', 'basic');
    setPlan('basic');
    setMessage('Downgraded to Basic (mock).');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-sm text-gray-400">Manage your subscription tier for the SRE Co-Pilot Workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-800 p-6">
          <h2 className="font-bold">Basic (Free)</h2>
          <p className="text-sm text-gray-400">Core tracking and post-mortem drafts with mock/local persistence.</p>
          <ul className="mt-3 text-sm list-disc list-inside text-gray-300">
            <li>Reincarnation checks (local/in-memory)</li>
            <li>Generate post-mortems (mock/AI limited)</li>
            <li>Dashboard and graph visualization</li>
          </ul>
          {plan === 'basic' ? (
            <div className="mt-4 text-sm text-amber-400">Current plan</div>
          ) : (
            <button onClick={handleDowngrade} className="mt-4 px-4 py-2 rounded bg-rose-600 text-white">Downgrade to Basic</button>
          )}
        </div>

        <div className="rounded-xl border border-gray-800 p-6">
          <h2 className="font-bold">Premium (Monthly)</h2>
          <p className="text-sm text-gray-400">Enable Supabase storage, live Coral queries, and priority AI generation.</p>
          <ul className="mt-3 text-sm list-disc list-inside text-gray-300">
            <li>Persistent embeddings in Supabase</li>
            <li>Live Coral queries and full source joins</li>
            <li>Higher-rate LLM generation</li>
          </ul>
          {plan === 'premium' ? (
            <div className="mt-4 text-sm text-emerald-400">Premium active</div>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <button onClick={handleUpgrade} disabled={loading} className="px-4 py-2 rounded bg-cyan-600 text-white">
                {loading ? 'Processing...' : 'Upgrade (Stripe)'}
              </button>
              <button onClick={handleRazorpay} disabled={loading} className="px-4 py-2 rounded bg-amber-600 text-white">
                {loading ? 'Processing...' : 'Pay with Razorpay'}
              </button>
            </div>
          )}
        </div>
      </div>

      {message && <div className="text-sm text-gray-300">{message}</div>}
    </div>
  );
}
