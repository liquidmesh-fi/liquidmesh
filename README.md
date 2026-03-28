<div align="center">

<img src="frontend/public/icon.png" alt="LiquidMesh" width="100" />

# LiquidMesh

**Sovereign Multi-Agent Trading Economy**

> The first autonomous multi-agent trading economy on X Layer. Four sovereign AI agents, each with its own OKX TEE wallet, earn by selling intelligence, spend via x402 payments, execute real onchain trades, and compound profits — No human in the loop.

![Hackathon](https://img.shields.io/badge/Hackathon-2026-333333?style=flat-square)
![Chain](<https://img.shields.io/badge/Network-X%20Layer%20(196)-19191A?style=flat-square&logoColor=white>)
![x402](https://img.shields.io/badge/Payments-x402-FF69B4?style=flat-square&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

**[Video Demo](https://youtu.be/CmT-r7lpnOk)** · **Live:** https://liquidmeshfi.xyz · **API:** https://api.liquidmeshfi.xyz · **Chain:** X Layer (chainId 196) · **Track:** AI DeFi/Trading

**Live Transactions on X Layer:**
[0xcdd413f9...20d37f](https://www.oklink.com/xlayer/tx/0xcdd413f9edcec7586f07015211fe2582af995e1bc8d71771171d7617b220d37f) · [0x624cd71c...5bdff](https://www.oklink.com/xlayer/tx/0x624cd71c21ed0a9a49ea1243a3b26e2b89cd014695c108d25cdee92a5ce5bdff) · [0x6923142b...e76570](https://www.oklink.com/xlayer/tx/0x6923142bcd0136e53107d16fd7da05ca4b215bc16ff809409f99202523e76570)

</div>

---

## What Is LiquidMesh?

LiquidMesh is an **autonomous multi-agent trading economy** on X Layer — not a trading bot. Four sovereign AI agents, each with its own OKX TEE-secured wallet, form a self-sustaining economic mesh. Agents earn by selling intelligence, spend to acquire it, execute real onchain swaps, and compound profits without any human intervention. The mesh funds itself.

Most autonomous trading systems are single agents with a hardcoded strategy. LiquidMesh separates each concern — signal detection, risk scoring, execution, and governance — into a **sovereign agent** with its own wallet, its own revenue stream, and its own accountability. When the mesh is profitable, surplus compounds back into capital without external funding.

---

## How It Works

### The Agent Economy

```
┌─────────────────────────────────────────────────────────────────────┐
│                        THE AGENT ECONOMY                            │
│                                                                     │
│    Scout           Analyst          Executor        Orchestrator    │
│   ┌──────┐  x402  ┌─────────┐ x402 ┌──────────┐  ┌─────────────┐  │
│   │ TEE  │───────▶│   TEE   │──────▶│   TEE    │  │    TEE      │  │
│   │wallet│        │  wallet │       │  wallet  │  │   wallet    │  │
│   └──────┘        └─────────┘       └──────────┘  └─────────────┘  │
│   Earns USDG    Pays + Earns USDG  Pays USDG,     Governs mesh,    │
│   sells signal  scores + sells     executes swap   compounds        │
└─────────────────────────────────────────────────────────────────────┘
```

| Agent            | Role               | Sells (x402)                      | Buys (x402)         |
| ---------------- | ------------------ | --------------------------------- | ------------------- |
| **Scout**        | Signal detection   | Signals — 0.001 USDG              | —                   |
| **Analyst**      | Risk scoring       | Scored opportunities — 0.002 USDG | Signals from Scout  |
| **Executor**     | Swap execution     | —                                 | Scores from Analyst |
| **Orchestrator** | Economy governance | —                                 | Mesh-wide metrics   |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           X LAYER (chainId 196)                          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     LIQUIDMESH BACKEND (Render)                  │   │
│  │                                                                  │   │
│  │  EventBus (in-memory)                                            │   │
│  │  ┌──────────┐  signal:ready  ┌──────────┐  score:ready          │   │
│  │  │  Scout   │───────────────▶│ Analyst  │──────────────┐        │   │
│  │  │  Agent   │                │  Agent   │              │        │   │
│  │  └──────────┘                └──────────┘              ▼        │   │
│  │       │ x402                      │ x402         ┌──────────┐   │   │
│  │       ▼                           ▼              │ Executor │   │   │
│  │  /scout/signal             /analyst/score        │  Agent   │   │   │
│  │  (HTTP 402 guard)          (HTTP 402 guard)      └──────────┘   │   │
│  │                                                       │ trade:done  │   │
│  │                                                       ▼          │   │
│  │                                              ┌──────────────┐   │   │
│  │                                              │ Orchestrator │   │   │
│  │                                              │    Agent     │   │   │
│  │                                              └──────────────┘   │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  Supabase: signals │ scores │ trades │ payments │ metrics │  │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      OKX ONCHAINOS APIs                          │   │
│  │  Signal API · Hot-token · Security · DEX Aggregator              │   │
│  │  x402 verify/settle · TEE Agentic Wallet · Portfolio             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   LIQUIDMESH FRONTEND (Vercel)                   │   │
│  │  Next.js · TanStack Query (5s poll) · shadcn/ui                  │   │
│  │  Dashboard · Landing · Agent Cards · Economy Panel               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## The Economy Loop

Every 30 minutes (one cycle):

```
Tick fires →

  Scout
   └─ Fetches smart money signals from X Layer (OKX signal + hot-token APIs)
   └─ Picks highest strength signal, stores in Supabase
   └─ Earns USDG when Analyst buys the signal via x402

  Analyst
   └─ Pays Scout (x402) → receives signal
   └─ Scores with OKX security APIs + GPT-4o (honeypot, holder concentration, price impact)
   └─ Earns USDG when Executor buys the scored opportunity via x402

  Executor
   └─ Pays Analyst (x402) → receives scored opportunity
   └─ If score ≥ 40 → builds OKB→USDC swap via OKX DEX Aggregator
   └─ Signs via OKX TEE Agentic Wallet → broadcasts to X Layer
   └─ Real txHash returned, verifiable on OKLink

  Orchestrator
   └─ Aggregates earn/spend ratio across all agents
   └─ When surplus USDG accumulates → compounds back into OKB capital
   └─ Surfaces full economy metrics to dashboard

→ Dashboard updates with new trade, payment proofs, agent health
```

---

## x402 Inter-Agent Payment Flow

Every piece of intelligence is behind an x402 paywall. No payment, no data — real USDG transfers on X Layer, verifiable on OKLink.

```
                    ┌───────────────────────────────────────────────┐
                    │           x402 PAYMENT PROTOCOL               │
                    └───────────────────────────────────────────────┘

   Analyst                    Scout Server                  OKX APIs
      │                            │                           │
      │── GET /scout/signal ──────▶│                           │
      │                            │                           │
      │◀─ 402 Payment Required ────│                           │
      │   X-Payment-Required:      │                           │
      │   { scheme, maxAmount,     │                           │
      │     payTo, network }       │                           │
      │                            │                           │
      │── OKX TEE: gen-msg-hash ──▶│  (internal TEE call)      │
      │◀─ EIP-3009 signature ──────│                           │
      │                            │                           │
      │── GET /scout/signal ──────▶│                           │
      │   X-Payment: base64(sig)   │                           │
      │                            │── POST /x402/verify ─────▶│
      │                            │◀─ { valid: true } ────────│
      │                            │── POST /x402/settle ─────▶│
      │                            │◀─ { txHash: "0x..." } ────│
      │                            │   (USDG transfer on X Layer)
      │◀─ 200 OK + signal data ────│                           │
      │   X-Payment-Response:      │                           │
      │   { txHash }               │                           │
```

**Payment amounts:**

- Analyst → Scout: `0.001 USDG` per signal
- Executor → Analyst: `0.002 USDG` per score

---

## OKX TEE Agentic Wallet

Each of the 4 agents uses a dedicated OKX TEE Agentic Wallet sub-account under one API key.

```
1 OKX API Key
├── Sub-account: Scout        (SCOUT_ACCOUNT_ID)
│   └─ AA wallet: SCOUT_WALLET_ADDRESS on X Layer
├── Sub-account: Analyst      (ANALYST_ACCOUNT_ID)
│   └─ AA wallet: ANALYST_WALLET_ADDRESS on X Layer
├── Sub-account: Executor     (EXECUTOR_ACCOUNT_ID)
│   └─ AA wallet: EXECUTOR_WALLET_ADDRESS on X Layer
└── Sub-account: Orchestrator (ORCHESTRATOR_ACCOUNT_ID)
    └─ AA wallet: ORCHESTRATOR_WALLET_ADDRESS on X Layer
```

TEE auth flow (per agent, per request):

```
POST /priapi/v5/wallet/agentic/auth/ak/init
  → { token, challenge }

POST /priapi/v5/wallet/agentic/auth/ak/verify
  → HMAC-SHA256(challenge, OKX_SECRET_KEY)
  → { sessionToken }  (scoped to accountId)
```

---

## Tech Stack

| Layer    | Tech                                                  |
| -------- | ----------------------------------------------------- |
| Runtime  | Bun + Hono (TypeScript)                               |
| Chain    | X Layer (chainId 196, native OKB)                     |
| Wallets  | OKX TEE Agentic Wallet (4 sub-accounts, 1 API key)    |
| Payments | x402 + EIP-3009 (USDG, 6 decimals)                    |
| Swap     | OKX DEX Aggregator (OKB → USDC via Uniswap V3)        |
| AI       | OpenAI GPT-4o (Analyst risk scoring)                  |
| Database | Supabase (signals, scores, trades, payments, metrics) |
| Frontend | Next.js + TanStack Query + shadcn/ui                  |
| Deploy   | Render (backend) + Vercel (frontend)                  |

---

## OKX OnchainOS APIs

| API                                                               | Used by                             |
| ----------------------------------------------------------------- | ----------------------------------- |
| `/api/v6/dex/signal/token/significant`                            | Scout: smart money signals          |
| `/api/v6/dex/market/token/hot-token`                              | Scout: trending token fallback      |
| `/api/v6/dex/token/security`                                      | Analyst: honeypot + rug scan        |
| `/api/v6/dex/token/token-list`                                    | Analyst: holder concentration       |
| `/api/v6/dex/aggregator/quote`                                    | Analyst: price impact check         |
| `/api/v6/dex/aggregator/swap`                                     | Executor: swap calldata             |
| `/api/v6/x402/verify` + `/x402/settle`                            | Scout + Analyst: payment settlement |
| `/priapi/v5/wallet/agentic/auth/ak/init`                          | All agents: TEE session auth        |
| `/priapi/v5/wallet/agentic/pre-transaction/unsignedInfo`          | Executor: AA tx signing             |
| `/priapi/v5/wallet/agentic/pre-transaction/broadcast-transaction` | Executor: AA broadcast              |

---

## API Routes

| Method | Path             | Description                                                |
| ------ | ---------------- | ---------------------------------------------------------- |
| GET    | `/mesh/status`   | Mesh running state + all agent statuses                    |
| GET    | `/mesh/summary`  | Trade counts + OKB spent + USDG earned + next cycle time   |
| GET    | `/mesh/economy`  | Full economy snapshot (earn/spend ratio, compound history) |
| GET    | `/mesh/balances` | Live OKB + USDG balance for each agent wallet              |
| GET    | `/mesh/trades`   | Recent trade history                                       |
| GET    | `/mesh/signals`  | Recent Scout signals                                       |
| GET    | `/mesh/scores`   | Recent Analyst scores                                      |
| GET    | `/mesh/payments` | x402 payment proofs                                        |
| POST   | `/mesh/tick`     | Run one full cycle (Scout→Analyst→Executor→Orchestrator)   |
| POST   | `/mesh/start`    | Start automatic 30min cycle loop                           |
| POST   | `/mesh/stop`     | Stop automatic loop                                        |
| GET    | `/scout/signal`  | x402-protected signal endpoint (Analyst calls this)        |
| GET    | `/analyst/score` | x402-protected score endpoint (Executor calls this)        |

---

## Repo Structure

```
liquidmesh-xlayer/
├── src/
│   ├── agents/
│   │   ├── scout/             # OKX signal APIs → Supabase + EventBus
│   │   ├── analyst/           # x402 pay Scout → GPT-4o score → x402 endpoint
│   │   ├── executor/          # x402 pay Analyst → OKX DEX swap → txHash
│   │   └── orchestrator/      # Metrics + earn/spend ratio + profit compounding
│   ├── services/onchainos/
│   │   ├── agentic-wallet.ts  # TEE auth + UserOp signing
│   │   ├── swap.ts            # OKX DEX aggregator
│   │   ├── payments.ts        # x402 client + guard middleware
│   │   ├── portfolio.ts       # Wallet balance queries
│   │   └── gateway.ts         # Tx simulation + broadcast
│   ├── routes/
│   │   ├── scout.ts           # x402-guarded: GET /scout/signal
│   │   ├── analyst.ts         # x402-guarded: GET /analyst/score
│   │   └── mesh.ts            # /mesh/tick · /mesh/status · /mesh/summary · /mesh/economy
│   └── memory/db.ts           # Supabase: signals, scores, trades, payments, metrics
└── frontend/                  # Next.js dashboard
```

---

## Running Locally

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- OKX account with API key (OnchainOS access)
- OpenAI API key
- Supabase project

### Install & Run

```bash
# Clone
git clone https://github.com/liquidmesh-fi/liquidmesh
cd liquidmesh-xlayer

# Install dependencies
bun install
cd frontend && bun install && cd ..

# Configure environment
cp .env.example .env
# Fill in all variables (see below)

# Start backend
bun dev          # :3001

# Start frontend
cd frontend && bun dev   # :3000
```

### OKX Wallet Setup

```bash
# Install onchainos CLI
curl -sSL https://raw.githubusercontent.com/okx/onchainos-skills/latest/install.sh | sh

# Login
onchainos wallet login

# Create 4 sub-accounts (one per agent)
onchainos wallet add   # repeat 4x — note each account ID

# Get X Layer addresses (chainId 196)
onchainos wallet addresses --chain 196
```

### Environment Variables

```bash
# OKX OnchainOS
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=

# AI + Database
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=

# Agent wallets (1 API key, 4 sub-accounts)
SCOUT_ACCOUNT_ID=
SCOUT_WALLET_ADDRESS=
ANALYST_ACCOUNT_ID=
ANALYST_WALLET_ADDRESS=
EXECUTOR_ACCOUNT_ID=
EXECUTOR_WALLET_ADDRESS=
ORCHESTRATOR_ACCOUNT_ID=
ORCHESTRATOR_WALLET_ADDRESS=

# Runtime
PUBLIC_API_URL=http://localhost:3001
EXECUTOR_SWAP_AMOUNT_OKB=0.001
ENABLE_AGENTS=false          # true = auto-start 30min loop on boot
CHECK_INTERVAL_MINUTES=30
```

---

## Deployed Infrastructure

| Service     | Host   | URL                            |
| ----------- | ------ | ------------------------------ |
| Frontend    | Vercel | `https://liquidmeshfi.xyz`     |
| Backend API | Render | `https://api.liquidmeshfi.xyz` |

---

## Roadmap (Phase 2)

- [ ] Live USDG funding flow for agent wallets
- [ ] Strategy plugins per agent (configurable risk thresholds)
- [ ] Multi-token support
- [ ] Agent performance leaderboard on dashboard
- [ ] Aget Identity ERC-8004

---

Built with [OKX OnchainOS](https://web3.okx.com/onchain-os) on [X Layer](https://www.okx.com/xlayer).

## License

MIT
