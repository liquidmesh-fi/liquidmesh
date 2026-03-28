# LiquidMesh — Architecture

## System Overview

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
│  │       │ x402                      │ x402         ┌──────────┐  │   │
│  │       ▼                           ▼              │ Executor │  │   │
│  │  /scout/signal             /analyst/score        │  Agent   │  │   │
│  │  (HTTP 402 guard)          (HTTP 402 guard)      └──────────┘  │   │
│  │                                                       │ trade:done│   │
│  │                                                       ▼          │   │
│  │                                              ┌──────────────┐   │   │
│  │                                              │ Orchestrator │   │   │
│  │                                              │    Agent     │   │   │
│  │                                              └──────────────┘   │   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  Supabase  │ signals │ scores │ trades │ payments │ metrics │  │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   OKX ONCHAINOS APIs                             │   │
│  │  Signal API · Hot-token · Security · DEX Aggregator              │   │
│  │  x402 verify/settle · TEE Agentic Wallet · Portfolio             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              LIQUIDMESH FRONTEND (Vercel)                        │   │
│  │  Next.js · TanStack Query (5s poll) · shadcn/ui                  │   │
│  │  Dashboard · Landing · Agent Cards · Economy Panel               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Internals

### Scout Agent

```
Scout.run()
  │
  ├─ okxSignal.getSignals(chainId=196)
  │     └─ GET /api/v6/dex/signal/token/significant
  │     └─ Sort by signalStrength (HIGH > MEDIUM > LOW)
  │
  ├─ [fallback] okxToken.getTrending(chainId=196)
  │     └─ GET /api/v6/dex/market/token/hot-token
  │
  ├─ insertSignal(supabase) → signals table
  │
  └─ eventBus.emit("signal:ready", { tokenAddress, tokenSymbol, signalStrength })
```

**x402 endpoint** — `GET /scout/signal`:
- Protected by x402 guard middleware
- Price: 0.001 USDG
- Returns: latest signal from in-memory cache

---

### Analyst Agent

```
Analyst.run()
  │
  ├─ Wait for eventBus "signal:ready"
  │
  ├─ settleX402("/scout/signal", analystWallet, analystAccountId)
  │     └─ GET /scout/signal → 402
  │     └─ OKX TEE: gen-msg-hash + sign EIP-3009
  │     └─ Replay with X-Payment header
  │     └─ Scout: /x402/verify → /x402/settle → txHash
  │     └─ Returns: signal data + payment proof
  │
  ├─ okxSecurity.getTokenSecurity(tokenAddress)
  │     └─ GET /api/v6/dex/token/security
  │     └─ Returns: isHoneypot, holderCount, top10HolderPercent
  │
  ├─ okxToken.getAdvancedInfo(tokenAddress)
  │     └─ GET /api/v6/dex/token/token-list
  │
  ├─ okxSwap.getQuote(OKB → token)
  │     └─ GET /api/v6/dex/aggregator/quote
  │     └─ Returns: priceImpact, estimatedOut
  │
  ├─ openai.chat({ model: "gpt-4o", prompt: buildScoringPrompt(allData) })
  │     └─ Returns: score (0–100), recommendation, reason, riskFactors
  │
  ├─ insertScore(supabase) → scores table
  │
  └─ eventBus.emit("score:ready", { score, recommendation, tokenAddress })
```

**x402 endpoint** — `GET /analyst/score`:
- Protected by x402 guard middleware
- Price: 0.002 USDG
- Returns: latest scored opportunity

**Scoring logic:**
- Score ≥ 40 → `recommendation: execute`
- Score < 40 → `recommendation: skip`

---

### Executor Agent

```
Executor.run()
  │
  ├─ Wait for eventBus "score:ready"
  │
  ├─ If recommendation !== "execute" → log skip, return
  │
  ├─ settleX402("/analyst/score", executorWallet, executorAccountId)
  │     └─ Same x402 flow as Analyst→Scout
  │
  ├─ okxSwap.getQuote(OKB_NATIVE → XLAYER_USDC, amount=0.005 OKB)
  │     └─ Rejects if priceImpact > 5%
  │
  ├─ okxSwap.buildSwapTransaction(swapAmountWei, executorAddress)
  │     └─ GET /api/v6/dex/aggregator/swap
  │     └─ Returns: tx.data, tx.to, tx.value, tx.gas
  │
  ├─ okxAgenticWallet.preTransactionUnsignedInfo({
  │     accountId, chainIndex: 196,
  │     fromAddr, toAddr, value: "0.005",   ← human-readable OKB (NOT wei)
  │     inputData: tx.data
  │   })
  │     └─ POST /priapi/v5/wallet/agentic/pre-transaction/unsignedInfo
  │     └─ Returns: extraData (AA UserOp)
  │
  ├─ okxAgenticWallet.broadcastAgenticTransaction({
  │     accountId, address, chainIndex,
  │     extraData: JSON.stringify(unsignedInfo.extraData)
  │   })
  │     └─ POST /priapi/v5/wallet/agentic/pre-transaction/broadcast-transaction
  │     └─ Returns: txHash | orderId
  │
  ├─ updateTrade(supabase, { tx_hash, status: "success" })
  │
  └─ eventBus.emit("trade:done", { txHash, amountOkb, success: true })
```

> **Critical implementation note**: `preTransactionUnsignedInfo` takes `value` in human-readable OKB (e.g. `"0.005"`), NOT wei. The OKX AA wallet API multiplies by 1e18 internally. Passing wei here causes transaction failure.

---

### Orchestrator Agent

```
Orchestrator.run()
  │
  ├─ getTradeSummary(supabase)
  │     └─ total, success, failed, totalOkbSpent
  │
  ├─ getTotalUsdgEarned(supabase)
  │     └─ SUM(payments.amount_usdg)
  │
  ├─ earnSpendRatio = totalUsdgEarned / (totalOkbSpent × OKB_PRICE_USD)
  │
  ├─ If totalUsdgEarned ≥ 0.005 AND sessionTrades > 0:
  │     └─ insertMetric(type="compound", value=totalUsdgEarned)
  │     └─ Log: "Surplus flagged for reinvestment"
  │
  ├─ insertMetric(type="trade_summary", metadata={ earnSpendRatio, ... })
  │
  └─ Return: { summary, totalUsdgEarned, earnSpendRatio }
```

---

## x402 Payment Flow

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
      │── OKX TEE: gen-msg-hash ──▶│ (internal TEE call)       │
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
- Analyst → Scout: 0.001 USDG per signal
- Executor → Analyst: 0.002 USDG per score

---

## OKX TEE Agentic Wallet

Each of the 4 agents uses a dedicated OKX TEE Agentic Wallet sub-account under one API key.

```
1 OKX API Key
├── Sub-account: Scout       (SCOUT_ACCOUNT_ID)
│   └─ AA wallet: SCOUT_WALLET_ADDRESS on X Layer
├── Sub-account: Analyst     (ANALYST_ACCOUNT_ID)
│   └─ AA wallet: ANALYST_WALLET_ADDRESS on X Layer
├── Sub-account: Executor    (EXECUTOR_ACCOUNT_ID)
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

## Database Schema (Supabase)

```sql
-- Smart money signals detected by Scout
CREATE TABLE signals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  token_address TEXT NOT NULL,
  token_symbol  TEXT NOT NULL,
  chain_index   TEXT NOT NULL,        -- "196" for X Layer
  signal_strength INTEGER NOT NULL,   -- 1=LOW, 2=MEDIUM, 3=HIGH
  raw_data    JSONB
);

-- Risk scores produced by Analyst
CREATE TABLE scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  signal_id       UUID REFERENCES signals(id),
  token_address   TEXT NOT NULL,
  score           INTEGER NOT NULL,   -- 0–100
  recommendation  TEXT NOT NULL,      -- "execute" | "skip"
  reason          TEXT NOT NULL,
  risk_factors    TEXT[]
);

-- Swap executions by Executor
CREATE TABLE trades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT now(),
  score_id      UUID REFERENCES scores(id),
  token_address TEXT NOT NULL,
  token_symbol  TEXT NOT NULL,
  amount_okb    TEXT NOT NULL,        -- e.g. "0.005"
  tx_hash       TEXT,                 -- null until confirmed
  status        TEXT NOT NULL,        -- "pending" | "success" | "failed"
  error         TEXT
);

-- x402 payment settlements
CREATE TABLE payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT now(),
  from_agent   TEXT NOT NULL,         -- "analyst" | "executor"
  to_endpoint  TEXT NOT NULL,         -- "/scout/signal" | "/analyst/score"
  amount_usdg  TEXT NOT NULL,         -- e.g. "0.001"
  tx_hash      TEXT NOT NULL,         -- OKX x402 settlement txHash
  purpose      TEXT NOT NULL          -- "signal" | "score"
);

-- Orchestrator economy metrics
CREATE TABLE metrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  agent_name  TEXT NOT NULL,
  metric_type TEXT NOT NULL,          -- "trade_summary" | "compound"
  value       NUMERIC NOT NULL,
  metadata    JSONB
);
```

---

## API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/mesh/status` | Mesh running state + all agent statuses |
| GET | `/mesh/summary` | Trade counts + OKB spent + USDG earned + next cycle time |
| GET | `/mesh/economy` | Full economy snapshot (earn/spend ratio, compound history) |
| GET | `/mesh/balances` | Live OKB + USDG balance for each agent wallet |
| GET | `/mesh/trades` | Recent trade history |
| GET | `/mesh/signals` | Recent Scout signals |
| GET | `/mesh/scores` | Recent Analyst scores |
| GET | `/mesh/payments` | x402 payment proofs |
| POST | `/mesh/tick` | Run one full cycle (Scout→Analyst→Executor→Orchestrator) |
| POST | `/mesh/start` | Start automatic 30min cycle loop |
| POST | `/mesh/stop` | Stop automatic loop |
| GET | `/scout/signal` | x402-protected signal endpoint (Analyst calls this) |
| GET | `/analyst/score` | x402-protected score endpoint (Executor calls this) |

---

## Event Bus

Internal coordination uses a typed in-memory EventBus (no external broker needed).

```typescript
// Events emitted between agents
"signal:ready"  → { tokenAddress, tokenSymbol, chainIndex, signalStrength }
"score:ready"   → { score, recommendation, tokenAddress, reason }
"trade:done"    → { txHash, amountOkb, tokenSymbol, success }
"budget:alert"  → { agentName, spent, limit }
"agent:error"   → { agentName, error }
```

Agents listen on the EventBus rather than calling each other directly. This keeps them decoupled — Scout doesn't know who is consuming its signals.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun + Hono (TypeScript) |
| Chain | X Layer (chainId 196, native OKB) |
| Wallets | OKX TEE Agentic Wallet (AA accounts) |
| Payments | x402 + EIP-3009 (USDG, 6 decimals) |
| DEX | OKX DEX Aggregator (Uniswap V3 routing) |
| AI | OpenAI GPT-4o (Analyst scoring only) |
| Database | Supabase (PostgreSQL) |
| Frontend | Next.js 15 + TanStack Query + shadcn/ui |
| Backend deploy | Render |
| Frontend deploy | Vercel |

---

## Import Direction (strict)

```
routes/  →  agents/  →  services/  →  OKX APIs
agents/  →  services/ only
services/ never imports from agents/ or routes/
```

Violating this creates circular dependencies. The services layer is pure — it only knows about the OKX API, never about agents or business logic.
