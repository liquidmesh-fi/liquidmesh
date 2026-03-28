# LiquidMesh

> A mesh of autonomous agents on X Layer — each with its own TEE wallet, each paying the next for intelligence via x402 micropayments — that finds, evaluates, and executes token trades entirely onchain.

**X Layer OnchainOS AI Hackathon submission.**

---

## What it does

LiquidMesh runs four specialized AI agents in a continuous loop on X Layer. Each agent has a dedicated OKX TEE wallet and a defined role. Agents pay each other for intelligence using the x402 protocol (EIP-3009 USDG micropayments). Every trade is verifiable on OKLink.

```
Scout → Analyst → Executor → Orchestrator
  (x402)   (x402)   (reports)   (governs)
```

- **Scout** monitors X Layer for smart money signals using OKX hot-token and signal APIs
- **Analyst** pays Scout for signals, scores them with OKX security + token APIs + GPT-4o, publishes scored opportunities behind its own x402 paywall
- **Executor** pays Analyst for scores, executes OKB → USDC swaps on X Layer DEX via OKX agentic wallet TEE signing
- **Orchestrator** tracks all agent activity, enforces spend caps, maintains the audit trail

---

## Live transaction proof

Real X Layer swap executed by the Executor agent:

**`0x6923142bcd0136e53107d16fd7da05ca4b215bc16ff809409f99202523e76570`**

[View on OKLink](https://www.oklink.com/xlayer/tx/0x6923142bcd0136e53107d16fd7da05ca4b215bc16ff809409f99202523e76570)

---

## Architecture

### Agent mesh (4 agents, each with its own TEE wallet)

| Agent | Role | OKX APIs used |
|---|---|---|
| Scout | Signal detection | `okx-dex-signal`, `okx-dex-token` (hot-token, trending) |
| Analyst | Risk scoring | `okx-security`, `okx-dex-token` (advanced, holders), `okx-dex-swap` (quote) |
| Executor | Trade execution | `okx-dex-swap` (build tx), `okx-agentic-wallet` (TEE sign + broadcast) |
| Orchestrator | Governance + metrics | `okx-wallet-portfolio`, `okx-agentic-wallet` (history) |

### x402 payment flow

Each agent's intelligence endpoint is protected by the x402 protocol:

```
1. Analyst probes /scout/signal → receives 402 + X-Payment-Required header
2. Analyst calls TEE: gen-msg-hash → HPKE decrypt → Ed25519 sign (EIP-3009)
3. Analyst replays request with X-Payment: base64(EIP-3009 transferWithAuthorization)
4. Scout server calls OKX /api/v6/x402/verify → validates signature
5. Scout server calls OKX /api/v6/x402/settle → executes on-chain USDG transfer
6. Scout returns signal data + X-Payment-Response with txHash
```

Same flow for Executor → Analyst (`/analyst/score`).

### TEE wallet signing

All four agents use OKX TEE agentic wallets (per-account sessions):

```
ak/init → ak/verify (HMAC signed, accountId scoped)
→ preTransactionUnsignedInfo (AA wallet UserOp)
→ broadcastAgenticTransaction
```

### Tech stack

- **Runtime**: Bun + Hono (TypeScript)
- **Chain**: X Layer (chainId 196, native OKB)
- **Swap**: OKX DEX Aggregator (OKB → USDC via Uniswap V3)
- **Wallet**: OKX TEE Agentic Wallet (4 sub-accounts under 1 API key)
- **Payments**: x402 + EIP-3009 (USDG, 6 decimals)
- **AI**: OpenAI GPT-4o (Analyst scoring only)
- **Database**: Supabase (signals, scores, trades, metrics)
- **Frontend**: Next.js + TanStack Query + shadcn/ui

---

## Repo structure

```
liquidmesh-xlayer/
├── src/
│   ├── agents/
│   │   ├── scout/        # Signal detection
│   │   ├── analyst/      # Risk scoring (OpenAI)
│   │   ├── executor/     # Trade execution
│   │   └── orchestrator/ # Governance + metrics
│   ├── services/onchainos/
│   │   ├── agentic-wallet.ts  # TEE auth + signing
│   │   ├── swap.ts            # OKX DEX aggregator
│   │   ├── payments.ts        # x402 client + server
│   │   └── gateway.ts         # Tx simulation + broadcast
│   ├── routes/
│   │   ├── scout.ts      # x402-protected signal endpoint
│   │   ├── analyst.ts    # x402-protected score endpoint
│   │   └── mesh.ts       # /mesh/tick orchestration
│   └── ...
└── frontend/             # Next.js dashboard
```

---

## Running locally

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env
# Fill in: OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE, OPENAI_API_KEY
# Fill in: SUPABASE_URL, SUPABASE_KEY
# Fill in: 4 agent wallet addresses + account IDs

# 3. Start backend
bun dev          # :3001

# 4. Trigger a mesh tick
curl -X POST http://localhost:3001/mesh/tick

# 5. Start frontend (separate terminal)
cd frontend && bun dev   # :3000
```

### OKX wallet setup

```bash
# Install onchainos CLI
curl -sSL https://raw.githubusercontent.com/okx/onchainos-skills/latest/install.sh | sh

# Login with API key
onchainos wallet login

# Create 4 sub-accounts
onchainos wallet add  # repeat 4 times, note account IDs

# Get addresses for X Layer (chain 196)
onchainos wallet addresses --chain 196
```

---

## Environment variables

```bash
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=

OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=

SCOUT_ACCOUNT_ID=
SCOUT_WALLET_ADDRESS=
ANALYST_ACCOUNT_ID=
ANALYST_WALLET_ADDRESS=
EXECUTOR_ACCOUNT_ID=
EXECUTOR_WALLET_ADDRESS=
ORCHESTRATOR_ACCOUNT_ID=
ORCHESTRATOR_WALLET_ADDRESS=

PUBLIC_API_URL=http://localhost:3001
EXECUTOR_SWAP_AMOUNT_OKB=0.001
ENABLE_AGENTS=false         # true = auto-start continuous mode
CHECK_INTERVAL_MINUTES=30
```

---

## OKX OnchainOS APIs used

| API | Used for |
|---|---|
| `/api/v6/dex/market/token/hot-token` | Scout: signal detection |
| `/api/v6/dex/signal/token/significant` | Scout: smart money signals |
| `/api/v6/dex/token/security` | Analyst: honeypot + risk scan |
| `/api/v6/dex/token/token-list` | Analyst: token metadata |
| `/api/v6/dex/aggregator/quote` | Analyst: price impact check |
| `/api/v6/dex/aggregator/swap` | Executor: swap calldata |
| `/api/v6/x402/verify` | Scout/Analyst: payment verification |
| `/api/v6/x402/settle` | Scout/Analyst: on-chain settlement |
| `/priapi/v5/wallet/agentic/auth/ak/init` | All agents: TEE auth |
| `/priapi/v5/wallet/agentic/auth/ak/verify` | All agents: session creation |
| `/priapi/v5/wallet/agentic/pre-transaction/unsignedInfo` | Executor: AA tx signing |
| `/priapi/v5/wallet/agentic/pre-transaction/broadcast-transaction` | Executor: AA tx broadcast |

---

## Hackathon qualification

- [x] Builds on X Layer ecosystem (chainId 196, OKB native, USDC on X Layer)
- [x] Integrates x402 payments (EIP-3009 USDG micropayments between agents)
- [x] Real X Layer transaction: `0x6923142bcd0136e53107d16fd7da05ca4b215bc16ff809409f99202523e76570`
- [x] Open-source on GitHub

---

Built with [OKX OnchainOS](https://web3.okx.com/onchain-os) on [X Layer](https://www.okx.com/xlayer).
