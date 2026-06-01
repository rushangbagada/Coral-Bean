# SRE Co-Pilot Workspace (Pirates of the Coral-bean)

Welcome to the **SRE Co-Pilot Workspace**! This project is an AI-powered incident tracking and post-mortem generation suite built for the "Pirates of the Coral-bean" hackathon.

## Architecture

This project was initially designed as an Express backend and Next.js frontend. To optimize for modern deployment, **the entire backend has been seamlessly migrated into Next.js 14 App Router API Routes**, resulting in a unified, full-stack application that eliminates CORS issues and simplifies deployment.

### Key Features
1. **Reincarnation Tracker Agent**: Uses AI embeddings to vectorize incoming incidents and queries a Supabase `pgvector` database to detect if a current incident is a "reincarnation" of a previously resolved historical issue.
2. **Post-Mortem Generator Agent**: Automatically compiles Slack messages, GitHub PRs, and PagerDuty alerts into a blameless, Markdown-formatted post-mortem report (Executive Summary, 5 Whys, Timeline, Action Items).
3. **Coral Integration**: We use a mock `coral.exe` binary (simulating a proprietary internal data layer) to dynamically query real-time GitHub PR data for historical incident linkages in our Graph Service.

---

## Setup Instructions

### 1. Install Dependencies
Navigate into the frontend directory and install dependencies:
```bash
cd sre-suite-frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (or create a `.env` file in `sre-suite-frontend`) and configure the following keys:

```env
# Server Config
PORT=3000
MOCK_MODE=false

# Coral Data Engine
CORAL_CONFIG_DIR=../.coral-config
CORAL_BIN_PATH=../.coral-bin/coral.exe

# Integration Tokens
GITHUB_TOKEN=your_github_token
SLACK_TOKEN=your_slack_token
PAGERDUTY_API_TOKEN=your_pd_token

# AI Provider (Using Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Supabase (pgvector)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
*(Note: Adding `SUPABASE_SERVICE_ROLE_KEY` bypasses Row-Level Security for backend indexing).*

### 3. Setup Supabase Database Schema
Run the following SQL commands in your Supabase SQL Editor to initialize the `pgvector` extension and required tables:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create incident embeddings table
CREATE TABLE IF NOT EXISTS incident_embeddings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id text UNIQUE NOT NULL,
  title text,
  description text,
  embedding vector(1536),
  source text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create HNSW or IVFFlat index for similarity search
CREATE INDEX ON incident_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create post_mortems table
CREATE TABLE IF NOT EXISTS post_mortems (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id text UNIQUE NOT NULL,
  markdown text,
  approved_by text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4. Run the Project
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Dockerized Deployment (Production)
Build and run the application as a standalone container:
```bash
# Build the production container
docker build -t sre-suite-frontend .

# Run the container
docker run -p 3000:3000 --env-file .env.local sre-suite-frontend
```

---

## Testing Data (Seeding)
If you are running this with a fresh Supabase instance, your similarity search will return 0 results. You can seed the database with mock historical incidents by running:
```bash
npm run seed
```

## Quick Integration Checks (no external services)
You can run self-contained integration sanity checks that exercise the embedding, graph, and post-mortem services in mock mode:

```bash
npm run check
```

This runs a lightweight script under `scripts/run-integration-checks.js` which sets `MOCK_MODE=true` and verifies core flows without requiring Coral, Supabase, or external API keys.

---

## Deployment & Configuration FAQs
- **Is both Gemini and OpenAI required?**
  No. Gemini (`GEMINI_API_KEY`) is the primary client used by the AI engine. OpenAI is only configured as a fallback.
- **Do I need to configure Stripe AND Razorpay?**
  No. Stripe and Razorpay are alternative payment integrations for premium upgrades. You only need to configure the provider that aligns with your market (or none if running in local mock mode).
- **For more information**, see the comprehensive [Deployment Guide](../docs/deploy.md) in the `docs` folder.

