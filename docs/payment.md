# Billing and Tiers

This project includes a mockable payment pipeline and two subscription tiers: **Basic** and **Premium**.

Overview
- Basic (free): In-memory mock flows, no persistent Supabase storage.
- Premium (paid): Enables Supabase persistence, live Coral queries, and priority AI usage.

Local dev (mock flow)
- The app provides a mock payment flow. The billing UI at `/billing` triggers a mocked checkout and stores the plan in `localStorage` as `sre_plan`.
- To test locally, open the Billing page and click `Upgrade to Premium` — the mock will set the plan locally.

Stripe (production)
- Set `STRIPE_SECRET_KEY` in your environment to enable real Stripe checkout session creation.
- Configure `STRIPE_WEBHOOK_SECRET` in your environment and add your webhook URL in the Stripe dashboard pointing to `/api/billing/webhook`.
- The API route `/api/billing/create-session` will create a Stripe Checkout Session for the given `priceId` and redirect the browser.

Razorpay (production)

- Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in your environment to enable Razorpay orders.
- Configure `RAZORPAY_WEBHOOK_SECRET` and add your webhook URL in the Razorpay dashboard pointing to `/api/billing/razorpay/webhook`.
- The API route `/api/billing/razorpay/create-order` will create a Razorpay Order and return `order_id` and `keyId`. In production you should open the Razorpay Checkout using those values.


Feature gating
- UI components check `localStorage.sre_plan` for `premium` to enable premium-only UI and actions. In production you should replace this with an authenticated user subscription lookup.

Security
- Never commit real Stripe keys or webhook secrets. Use environment variables or your cloud provider's secrets store.

*** End of Document
