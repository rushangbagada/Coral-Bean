# Deployment Guide

This document contains quick steps to deploy the SRE Co-Pilot Workspace.

## Vercel (recommended for Next.js frontend)
1. Sign in to Vercel and import the repository `rushangbagada/Coral-Bean`.
2. Set the Project Root to `sre-suite-frontend` in the Import settings.
3. Add the environment variables from `.env.example` in the Project Settings > Environment Variables.
4. Deploy; Vercel will run `npm install` and `npm run build` automatically.

## Render
1. Create a new Web Service and connect your GitHub repository.
2. Set the Root Directory to `sre-suite-frontend` and Branch to `main`.
3. Use `npm ci && npm run build` as the Build Command and `npm start` as the Start Command.
4. Add environment variables from `.env.example` under the service settings.

## Docker Container (Enterprise Deployment)
The application includes an optimized multi-stage, non-root `Dockerfile` in the frontend directory.
1. Build the Docker image:
   ```bash
   cd sre-suite-frontend
   docker build -t sre-suite-frontend .
   ```
2. Run the container on port 3000:
   ```bash
   docker run -p 3000:3000 --env-file .env.local sre-suite-frontend
   ```
*Note: The Next.js configuration is optimized to run as a `standalone` target (configured in `next.config.mjs`), stripping away all unused dependencies to minimize container footprint.*

## GitHub Actions CI
A CI workflow is included at `.github/workflows/ci.yml` that runs the integration checks and builds the Next.js app on push and pull requests.

## Notes & Architecture Rules
- **Mock Mode:** The project supports `MOCK_MODE=true` for offline demos and testing. None of the payment or external integration keys are needed when mock mode is enabled.
- **AI Providers:** Gemini (`GEMINI_API_KEY`) is the primary AI client used by SRE Co-Pilot. OpenAI (`OPENAI_API_KEY`) is configured as an alternative/fallback provider. You do NOT need both; setting `GEMINI_API_KEY` is fully sufficient.
- **Payment Tiers:** Stripe and Razorpay are alternative payment options. You can deploy and configure only one of these providers based on your target region (e.g., Stripe for global/US, Razorpay for UPI/India), or run without both using the local mock flow.
- **Secrets Management:** Never commit real secrets. Store all integration credentials (GitHub, Slack, PagerDuty, Sentry) in your cloud hosting provider's environment variables.

