# LiquidMesh — What We Built & How to Test It

## What Is LiquidMesh?

LiquidMesh is an **autonomous multi-agent trading economy** running on X Layer (OKB chain, chainId 196).

It is NOT a single trading bot. It is four independent AI agents — each with its own OKX TEE-secured wallet — that form a self-sustaining economic mesh. Each agent earns revenue by selling intelligence to the next agent, and the mesh compounds profits without any human intervention.

The key insight: **agents pay each other for intelligence using real USDG micropayments (x402 protocol)**. Every data transfer between agents is a real on-chain settlement.

---

## The Four Agents

### Scout — Signal Detection
- **Earns**: USDG from Analyst (x402 payment per signal sold)
- **What it does**: Calls OKX smart money signal API + hot-token API on X Layer (chain 196). Picks the token with the highest `signalStrength`. Falls back to trending tokens if no smart money signals exist. Stores the signal in Supabase.
- **Sells**: Market signals via a protected HTTP endpoint (`/scout/signal`)

### Analyst — Risk Scoring
- **Pays**: Scout 0.001 USDG per signal (x402)
- **Earns**: USDG from Executor (x402 payment per score sold)
- **What it does**: Buys Scout's signal, runs OKX security scan (honeypot detection, holder concentration, liquidity depth), gets a swap quote for price impact, then sends all data to GPT-4o for a 0–100 risk/reward score. Scores ≥ 40 get `recommendation: execute`.
- **Sells**: Scored opportunities via a protected HTTP endpoint (`/analyst/score`)

### Executor — Swap Execution
- **Pays**: Analyst 0.002 USDG per score (x402)
- **What it does**: If score ≥ 40, builds OKB → USDC swap calldata via OKX DEX Aggregator, signs it using the OKX TEE Agentic Wallet (AA account), and broadcasts to X Layer. Returns a real txHash on OKLink.
- **Swap amount**: 0.005 OKB (~$0.42) per tick

### Orchestrator — Economy Governance
- **What it does**: Runs after every tick. Queries total USDG earned across all x402 settlements and total OKB spent on swaps. Derives earn/spend ratio. When USDG earnings exceed 0.005 threshold AND a trade succeeded, logs a compound metric to Supabase. Surfaces all metrics to the dashboard.

---

## How a Single Tick Works

One tick = one complete cycle through all four agents, triggered by `POST /mesh/tick`.

```
1. Scout runs
   └─ Calls OKX: signal list (chain 196) + hot-token fallback
   └─ Picks highest signalStrength token
   └─ Inserts into Supabase `signals` table
   └─ Emits `signal:ready` on EventBus

2. Analyst runs (200ms after Scout)
   └─ Sees `signal:ready` on EventBus
   └─ Calls GET /scout/signal → receives HTTP 402 + payment instructions
   └─ Signs EIP-3009 USDG transfer via OKX TEE wallet
   └─ Replays request with X-Payment header
   └─ Scout verifies via OKX /x402/verify → settles via OKX /x402/settle
   └─ Scout returns signal + settlement txHash
   └─ Analyst runs OKX security + holder + quote checks
   └─ Sends to GPT-4o → score (0–100) + recommendation
   └─ Inserts into Supabase `scores` table
   └─ Emits `score:ready` on EventBus

3. Executor runs (200ms after Analyst)
   └─ Sees `score:ready` on EventBus
   └─ If recommendation == "execute" (score ≥ 40):
       └─ Calls GET /analyst/score → receives HTTP 402
       └─ Signs + settles x402 payment (USDG → Analyst)
       └─ Builds OKB→USDC swap calldata (OKX DEX Aggregator)
       └─ Calls preTransactionUnsignedInfo (OKX TEE AA wallet)
       └─ Calls broadcastAgenticTransaction
       └─ Gets real txHash on X Layer
       └─ Updates Supabase `trades` table: status=success, tx_hash
       └─ Emits `trade:done` on EventBus
   └─ If score < 40: logs skip, no swap

4. Orchestrator runs (200ms after Executor)
   └─ Queries Supabase: total trades, USDG earned, OKB spent
   └─ Derives earn/spend ratio
   └─ If USDG earned ≥ 0.005 AND trade succeeded: logs compound metric
   └─ Inserts into Supabase `metrics` table
   └─ Returns full economy summary
```

**Total tick time**: ~10–30 seconds depending on OKX API latency and GPT-4o response time.

---

## The x402 Payment Flow (in detail)

This is the core innovation — agents pay each other with no human approval:

```
Analyst → GET /scout/signal
← HTTP 402 Payment Required
← Header: X-Payment-Required: { scheme, maxAmount, payTo, network }

Analyst → OKX TEE: gen-msg-hash (EIP-3009 transferWithAuthorization)
← signed authorization (HPKE encrypted, Ed25519)

Analyst → GET /scout/signal
→ Header: X-Payment: base64(EIP-3009 payload)

Scout server → OKX /api/v6/x402/verify (validates signature)
Scout server → OKX /api/v6/x402/settle (executes USDG transfer on X Layer)
← settlement txHash

Scout → 200 OK + signal data
```

Same pattern for Executor → Analyst on `/analyst/score`.

Every x402 settlement is a **real USDG transfer on X Layer**, visible on OKLink.

---

## Live Infrastructure

| Service | URL |
|---|---|
| Frontend | https://liquidmeshfi.xyz |
| Backend API | https://liquidmesh.onrender.com |
| Dashboard | https://liquidmeshfi.xyz/dashboard |
| Trigger tick | `POST https://liquidmesh.onrender.com/mesh/tick` |
| Mesh status | `GET https://liquidmesh.onrender.com/mesh/status` |
| Economy metrics | `GET https://liquidmesh.onrender.com/mesh/economy` |
| Agent balances | `GET https://liquidmesh.onrender.com/mesh/balances` |

---

## How to Test — Step by Step

### Prerequisites
- Executor wallet funded with OKB (current: ~0.0988 OKB)
- Render backend deployed (auto-deploys on push to main)
- Vercel frontend deployed (auto-deploys on push to main)
- `EXECUTOR_SWAP_AMOUNT_OKB=0.005` set on Render

---

### Step 1 — Verify backend is live

```bash
curl https://liquidmesh.onrender.com/mesh/status
```

Expected response:
```json
{ "success": true, "data": { "isRunning": false, "agents": [...] } }
```

If you get a 502/timeout, Render is still spinning up (cold start takes ~30s).

---

### Step 2 — Check agent wallets have funds

```bash
curl https://liquidmesh.onrender.com/mesh/balances
```

Expected: Executor wallet shows `okb: "0.0988..."`. All 4 agents show their wallet addresses.

---

### Step 3 — Trigger a tick

```bash
curl -X POST https://liquidmesh.onrender.com/mesh/tick
```

This runs all 4 agents sequentially. Watch the response — it returns results from each agent:

```json
{
  "success": true,
  "data": [
    { "status": "fulfilled", "value": { "success": true, "message": "Signal stored: OKB (strength: 3)" } },
    { "status": "fulfilled", "value": { "success": true, "message": "Score: 67, recommendation: execute" } },
    { "status": "fulfilled", "value": { "success": true, "message": "Swap executed: 0.005 OKB → USDC", "data": { "txHash": "0x..." } } },
    { "status": "fulfilled", "value": { "success": true, "message": "Metrics aggregated" } }
  ]
}
```

**If Executor returns a txHash → tick succeeded.**

---

### Step 4 — Verify on OKLink

Take the txHash from Step 3 and check:

```
https://www.oklink.com/xlayer/tx/<txHash>
```

You should see: OKB → USDC swap from the Executor wallet address.

---

### Step 5 — Check dashboard

Open https://liquidmeshfi.xyz/dashboard

You should see:
- **Agent cards**: OKB + USDG balances populated (not showing `—`)
- **Activity feed**: new log entries from Scout, Analyst, Executor, Orchestrator
- **Trade table**: new row with the txHash, token, amount, status=success
- **Economy panel**: USDG Earned updated, cycle countdown running
- **Mesh controls**: "Next cycle in Xm Ys · every 30min"

---

### Step 6 — Check the economy endpoint

```bash
curl https://liquidmesh.onrender.com/mesh/economy
```

Expected after a successful tick with x402 payments:
```json
{
  "success": true,
  "data": {
    "totalUsdgEarned": 0.003,
    "totalOkbSpent": 0.005,
    "earnSpendRatio": 0.0007,
    "lastTickAt": "2026-03-28T...",
    "nextCycleAt": "2026-03-28T...",
    "cycleIntervalMinutes": 30,
    "tradeCount": 1,
    "tradeSuccessRate": 1
  }
}
```

---

### Common Failures & Fixes

| Symptom | Cause | Fix |
|---|---|---|
| Executor returns "Waiting for score" | Analyst scored < 40 or skipped | Normal — market conditions. Run tick again. |
| "Price impact too high" | Swap size too small for route | Already handled: 0.005 OKB is safe |
| "Pre-transaction failed" | TEE session expired | Restart backend or wait — sessions auto-renew |
| x402 payment fails | USDG balance on Analyst/Scout too low | Fund Analyst/Scout wallets with USDG |
| Agent balances show "—" | Backend cold start, first poll pending | Refresh dashboard after 30s |
| Render 502 | Cold start (free tier sleeps after 15min) | Hit `/mesh/status` first to wake it, then tick |

---

### Running Multiple Ticks (demo mode)

For the demo video, trigger 2–3 ticks manually:

```bash
# Tick 1
curl -X POST https://liquidmesh.onrender.com/mesh/tick

# Wait 10s for Render to settle
sleep 10

# Tick 2
curl -X POST https://liquidmesh.onrender.com/mesh/tick
```

Or use auto mode (runs every 30min automatically):

```bash
curl -X POST https://liquidmesh.onrender.com/mesh/start
```

Stop with:

```bash
curl -X POST https://liquidmesh.onrender.com/mesh/stop
```

---

### Proof Points for Submission

After testing, collect these for the submission form:

1. **X Layer txHash** — from Executor in tick response (or OKLink)
2. **x402 payment txHash** — from `/mesh/payments` endpoint
3. **Live URL** — https://liquidmeshfi.xyz
4. **GitHub repo** — public, with this codebase
5. **Demo video** — show: landing → dashboard → run tick → txHash on OKLink → economy panel

```bash
# Get all payment proofs (x402 settlements)
curl https://liquidmesh.onrender.com/mesh/payments

# Get all trades
curl https://liquidmesh.onrender.com/mesh/trades
```
