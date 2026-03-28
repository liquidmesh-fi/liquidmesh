# LiquidMesh

> An autonomous multi-agent trading economy on X Layer. Four sovereign AI agents — each with a TEE wallet — discover signals, score risk, execute swaps, and compound profits entirely onchain. No human in the loop. The mesh funds itself.

**X Layer OnchainOS AI Hackathon submission.**

**Live:** [https://liquidmeshfi.xyz](https://liquidmeshfi.xyz) · API: [https://api.liquidmeshfi.xyz](https://api.liquidmeshfi.xyz)

---

## The Story

Most autonomous trading systems are single agents with a hardcoded strategy. LiquidMesh is an **autonomous multi-agent trading economy** — not one bot, but four sovereign agents that form a self-sustaining economic mesh. Each agent earns by selling intelligence, spends to acquire it, and the economy compounds profits without any human intervention.

```
Scout earns USDG  ←  sells signals via x402
Analyst pays Scout, earns from Executor  ←  pays for intelligence, profits from scoring
Executor pays Analyst, executes swaps  ←  acquires scored opportunities, trades OKB
Orchestrator governs + compounds  ←  monitors the economy, reinvests surplus into capital
```

When the mesh is profitable, Orchestrator detects surplus USDG earnings and compounds them back into OKB capital — growing the trading base without any human top-up. The mesh funds itself.

---

## Live Transaction Proof

Real X Layer swap executed by the Executor agent:

**`0x6923142bcd0136e53107d16fd7da05ca4b215bc16ff809409f99202523e76570`**

[View on OKLink →](https://www.oklink.com/xlayer/tx/0x6923142bcd0136e53107d16fd7da05ca4b215bc16ff809409f99202523e76570)

---

## The Four Pillars

### 1. Multi-Agent Orchestration

Four specialized agents, each sovereign, each with a dedicated OKX TEE wallet and a defined role in the mesh:

| Agent | Role | Intelligence sold | Intelligence bought |
|---|---|---|---|
| **Scout** | Signal detection | Signals (x402) | — |
| **Analyst** | Risk scoring | Scored opportunities (x402) | Signals from Scout |
| **Executor** | Swap execution | — | Scores from Analyst |
| **Orchestrator** | Economy governance | — | Mesh-wide metrics |

### 2. x402 Inter-Agent Payments

Every piece of intelligence is behind an x402 paywall. Agents pay each other with USDG using EIP-3009 signed transfers via OKX TEE — real on-chain settlements, verifiable on OKLink, with no human approvals.

```
Analyst → POST /scout/signal
← 402 Payment Required + X-Payment-Required header
Analyst signs EIP-3009 USDG transfer via OKX TEE
Analyst replays request + X-Payment: base64(signature)
Scout calls OKX /x402/verify → /x402/settle
Scout returns signal + settlement txHash
```

### 3. Autonomous Onchain Execution

Executor builds swap calldata via OKX DEX Aggregator, signs via OKX TEE Agentic Wallet, and broadcasts to X Layer. Every trade is a real swap — OKB → USDC — with a real txHash on OKLink.

### 4. Profit Compounding

Orchestrator monitors the mesh economy every cycle:
- Tracks total USDG earned (x402 settlements) vs. total OKB spent (swaps)
- Derives earn/spend ratio and mesh runway
- When surplus accumulates: compounds earnings back into OKB capital, growing the mesh's trading position without external funding

---

## Architecture

### Tech Stack

| Layer | Tech |
|---|---|
| Runtime | Bun + Hono (TypeScript) |
| Chain | X Layer (chainId 196, native OKB) |
| Wallets | OKX TEE Agentic Wallet (4 sub-accounts, 1 API key) |
| Payments | x402 + EIP-3009 (USDG, 6 decimals) |
| Swap | OKX DEX Aggregator (OKB → USDC via Uniswap V3) |
| AI | OpenAI GPT-4o (Analyst risk scoring) |
| Database | Supabase (signals, scores, trades, payments, metrics) |
| Frontend | Next.js + TanStack Query + shadcn/ui |
| Deploy | Railway (backend) + Vercel (frontend) |

### OKX OnchainOS APIs

| API | Used by |
|---|---|
| `/api/v6/dex/signal/token/significant` | Scout: smart money signals |
| `/api/v6/dex/market/token/hot-token` | Scout: trending token fallback |
| `/api/v6/dex/token/security` | Analyst: honeypot + rug scan |
| `/api/v6/dex/token/token-list` | Analyst: holder concentration |
| `/api/v6/dex/aggregator/quote` | Analyst: price impact check |
| `/api/v6/dex/aggregator/swap` | Executor: swap calldata |
| `/api/v6/x402/verify` + `/x402/settle` | Scout + Analyst: payment settlement |
| `/priapi/v5/wallet/agentic/auth/ak/init` | All agents: TEE session auth |
| `/priapi/v5/wallet/agentic/pre-transaction/unsignedInfo` | Executor: AA tx signing |
| `/priapi/v5/wallet/agentic/pre-transaction/broadcast-transaction` | Executor: AA broadcast |

### Mesh Cycle (every 30 minutes)

```
Tick fires →
  Scout: fetch smart money signals from X Layer, pick highest strength, store in Supabase
  Analyst: pay Scout (x402), score signal with OKX security + GPT-4o, publish behind x402
  Executor: pay Analyst (x402), if score ≥ 40 → build + sign + broadcast OKB→USDC swap
  Orchestrator: aggregate metrics, compute earn/spend ratio, compound surplus if profitable
→ Dashboard updates with new trade, payment proofs, agent health
```

---

## Repo Structure

```
liquidmesh-xlayer/
├── src/
│   ├── agents/
│   │   ├── scout/          # OKX signal APIs → Supabase + EventBus
│   │   ├── analyst/        # x402 pay Scout → GPT-4o score → x402 endpoint
│   │   ├── executor/       # x402 pay Analyst → OKX DEX swap → txHash
│   │   └── orchestrator/   # Metrics + earn/spend ratio + profit compounding
│   ├── services/onchainos/
│   │   ├── agentic-wallet.ts  # TEE auth + UserOp signing
│   │   ├── swap.ts            # OKX DEX aggregator
│   │   ├── payments.ts        # x402 client + guard middleware
│   │   ├── portfolio.ts       # Wallet balance queries
│   │   └── gateway.ts         # Tx simulation + broadcast
│   ├── routes/
│   │   ├── scout.ts      # x402-guarded: POST /scout/signal
│   │   ├── analyst.ts    # x402-guarded: POST /analyst/score
│   │   └── mesh.ts       # /mesh/tick · /mesh/status · /mesh/summary · /mesh/economy
│   └── memory/db.ts      # Supabase: signals, scores, trades, payments, metrics
└── frontend/             # Next.js dashboard
```

---

## Deployed Infrastructure

| Service | Host | URL |
|---|---|---|
| Frontend | Vercel | `https://liquidmeshfi.xyz` |
| Backend API | Render | `https://api.liquidmeshfi.xyz` |

Trigger a live tick: `curl -X POST https://api.liquidmeshfi.xyz/mesh/tick`

View mesh economy: `curl https://api.liquidmeshfi.xyz/mesh/economy`

---

## Running Locally

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Fill in OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE
# Fill in OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY
# Fill in 4 agent wallet addresses + account IDs

# Start backend
bun dev          # :3001

# Trigger a mesh tick (runs all 4 agents sequentially)
curl -X POST http://localhost:3001/mesh/tick

# View economy metrics
curl http://localhost:3001/mesh/economy

# Start frontend (separate terminal)
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

# Get X Layer addresses (chain 196)
onchainos wallet addresses --chain 196
```

---

## Environment Variables

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

## Hackathon Qualification

- [x] **X Layer ecosystem** — chainId 196, OKB native, USDC on X Layer DEX
- [x] **x402 agentic payments** — EIP-3009 USDG micropayments between agents, settled via OKX
- [x] **Real X Layer transaction** — `0x6923142bcd0136e53107d16fd7da05ca4b215bc16ff809409f99202523e76570`
- [x] **Multi-agent orchestration** — 4 sovereign agents with independent TEE wallets
- [x] **Open-source** on GitHub

---

Built with [OKX OnchainOS](https://web3.okx.com/onchain-os) on [X Layer](https://www.okx.com/xlayer).
