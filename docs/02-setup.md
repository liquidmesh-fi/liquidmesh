# LiquidMesh — Setup Guide

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- OKX account with API key (for OnchainOS)
- OpenAI API key
- Supabase project
- Git

---

## 1. Clone the Repo

```bash
git clone https://github.com/liquidmesh-fi/liquidmesh
cd liquidmesh-xlayer
```

---

## 2. Install Dependencies

```bash
# Backend (repo root)
bun install

# Frontend
cd frontend && bun install && cd ..
```

---

## 3. OKX Wallet Setup

LiquidMesh requires **4 TEE Agentic Wallet sub-accounts** under one OKX API key — one per agent.

### 3a. Get OKX API credentials

1. Go to [OKX Web3 API](https://web3.okx.com/onchain-os)
2. Create an API key with `read + trade` permissions
3. Note: `OKX_API_KEY`, `OKX_SECRET_KEY`, `OKX_PASSPHRASE`

### 3b. Install the onchainos CLI

```bash
curl -sSL https://raw.githubusercontent.com/okx/onchainos-skills/latest/install.sh | sh
```

### 3c. Login and create 4 sub-accounts

```bash
# Login with your API key
onchainos wallet login

# Create one sub-account per agent (run 4 times)
onchainos wallet add   # → note the accountId for Scout
onchainos wallet add   # → note the accountId for Analyst
onchainos wallet add   # → note the accountId for Executor
onchainos wallet add   # → note the accountId for Orchestrator
```

### 3d. Get wallet addresses on X Layer (chain 196)

```bash
onchainos wallet addresses --chain 196
```

This returns the AA wallet address for each sub-account. Note these — they go into your `.env`.

### 3e. Fund the Executor wallet

Only the Executor wallet needs OKB to execute swaps. The other agents earn USDG via x402 payments.

- Send **≥ 0.1 OKB** to `EXECUTOR_WALLET_ADDRESS` on X Layer
- Recommended swap size: `EXECUTOR_SWAP_AMOUNT_OKB=0.005` (~$0.42 at ~$83/OKB)
- This gives ~20 swaps before needing a top-up

> The swap is OKB → USDC and stays in the Executor wallet. It is not a loss — just a conversion.

---

## 4. Supabase Setup

### 4a. Create a project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your `SUPABASE_URL` and `SUPABASE_KEY` (anon key)

### 4b. Run the schema

In the Supabase SQL editor, run:

```sql
-- Signals detected by Scout
CREATE TABLE signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  token_address   TEXT NOT NULL,
  token_symbol    TEXT NOT NULL,
  chain_index     TEXT NOT NULL,
  signal_strength INTEGER NOT NULL,
  raw_data        JSONB
);

-- Risk scores from Analyst
CREATE TABLE scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  signal_id       UUID,
  token_address   TEXT NOT NULL,
  score           INTEGER NOT NULL,
  recommendation  TEXT NOT NULL,
  reason          TEXT NOT NULL,
  risk_factors    TEXT[]
);

-- Trades executed by Executor
CREATE TABLE trades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT now(),
  score_id      UUID,
  token_address TEXT NOT NULL,
  token_symbol  TEXT NOT NULL,
  amount_okb    TEXT NOT NULL,
  tx_hash       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  error         TEXT
);

-- x402 payment settlements
CREATE TABLE payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT now(),
  from_agent   TEXT NOT NULL,
  to_endpoint  TEXT NOT NULL,
  amount_usdg  TEXT NOT NULL,
  tx_hash      TEXT NOT NULL,
  purpose      TEXT NOT NULL
);

-- Orchestrator economy metrics
CREATE TABLE metrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  agent_name  TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value       NUMERIC NOT NULL,
  metadata    JSONB
);
```

---

## 5. Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Fill in all values:

```bash
# ── OKX OnchainOS ─────────────────────────────────────────────
OKX_API_KEY=your_api_key
OKX_SECRET_KEY=your_secret_key
OKX_PASSPHRASE=your_passphrase

# ── Agent TEE sub-accounts (from Step 3c/3d) ──────────────────
SCOUT_ACCOUNT_ID=
SCOUT_WALLET_ADDRESS=0x...

ANALYST_ACCOUNT_ID=
ANALYST_WALLET_ADDRESS=0x...

EXECUTOR_ACCOUNT_ID=
EXECUTOR_WALLET_ADDRESS=0x...

ORCHESTRATOR_ACCOUNT_ID=
ORCHESTRATOR_WALLET_ADDRESS=0x...

# ── OpenAI ────────────────────────────────────────────────────
OPENAI_API_KEY=sk-...

# ── Supabase ──────────────────────────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key

# ── Runtime ───────────────────────────────────────────────────
PUBLIC_API_URL=http://localhost:3001
EXECUTOR_SWAP_AMOUNT_OKB=0.005    # ~$0.42 per swap at $83/OKB
CHECK_INTERVAL_MINUTES=30          # auto-cycle interval
ENABLE_AGENTS=false                # set true to auto-start on boot
```

Frontend environment (create `frontend/.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 6. Run Locally

### Start the backend

```bash
# From repo root
bun dev
# → Hono server running on http://localhost:3001
```

### Start the frontend

```bash
cd frontend
bun dev
# → Next.js running on http://localhost:3000
```

### Trigger a tick manually

```bash
curl -X POST http://localhost:3001/mesh/tick
```

Watch the terminal for agent logs. A successful tick looks like:

```
[Scout]        Signal stored: OKB (strength: 3)
[Analyst]      x402 paid → 0.001 USDG settled, txHash: 0x...
[Analyst]      Score: 67 | recommendation: execute
[Executor]     x402 paid → 0.002 USDG settled, txHash: 0x...
[Executor]     Swap broadcast: 0x...
[Orchestrator] Economy: 1 trades, 1 success, USDG earned: 0.003000
```

### Enable auto mode (optional, local)

Set `ENABLE_AGENTS=true` in `.env` — the mesh auto-starts on `bun dev` and ticks every `CHECK_INTERVAL_MINUTES`.

---

## 7. Deployment

### Backend → Render

1. Push repo to GitHub (must be public for hackathon)
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect to your GitHub repo
4. Configure:

| Setting | Value |
|---|---|
| Root directory | _(repo root)_ |
| Build command | `bun install` |
| Start command | `bun start` |
| Node version | — (Bun handles this) |

5. Add all environment variables from Step 5
6. Set `PUBLIC_API_URL` to your Render URL (e.g. `https://api.liquidmeshfi.xyz`)
7. Set `ENABLE_AGENTS=false` on Render (trigger manually during testing, or `true` for production auto-run)
8. Deploy

> **Note:** Render free tier sleeps after 15 minutes of inactivity. Hit `/mesh/status` to wake it before triggering a tick.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://api.liquidmeshfi.xyz
   ```
5. Deploy

Vercel auto-deploys on every push to `main`.

---

## 8. Production Configuration

For a live production deployment where the mesh runs automatically:

```bash
# On Render, set:
ENABLE_AGENTS=true           # auto-start mesh on boot
CHECK_INTERVAL_MINUTES=30    # tick every 30 minutes
EXECUTOR_SWAP_AMOUNT_OKB=0.005
```

With `ENABLE_AGENTS=true`, you never need to manually trigger ticks. The mesh wakes up, runs every 30 minutes, and the dashboard polls the API to show live state.

To trigger a tick on demand from the dashboard, use the **"▶ Run Tick"** button — this calls `POST /mesh/tick` for you.

---

## Troubleshooting

**`Error: Invalid environment variables`**
→ One or more required env vars are missing or malformed. Check the Zod error output in the logs.

**`TEE session expired` or `401 from OKX`**
→ The TEE session tokens are short-lived. The agent re-authenticates automatically on the next tick. If persistent, verify `OKX_API_KEY`, `OKX_SECRET_KEY`, `OKX_PASSPHRASE` are correct.

**`No swap quote returned`**
→ OKX DEX Aggregator found no route. Usually happens if `EXECUTOR_SWAP_AMOUNT_OKB` is too low (< 0.001 OKB). Use 0.005 or higher.

**`Pre-transaction failed: executeResult false`**
→ The AA wallet rejected the transaction. Most common cause: Executor wallet has insufficient OKB balance. Check OKLink.

**`x402 payment failed`**
→ The paying agent (Analyst or Executor) has insufficient USDG. Fund the wallet with a small amount of USDG on X Layer.
