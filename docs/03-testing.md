# LiquidMesh — Testing Guide

## Overview

LiquidMesh runs automatically in production (`ENABLE_AGENTS=true`, every 30 minutes). This guide covers:
- How to trigger and observe a tick manually during testing
- What a successful tick looks like at every layer
- How to verify proof on OKLink
- Common failures and fixes

> **You do not need to type curl commands in production.** Set `ENABLE_AGENTS=true` on Render and the mesh self-runs. The curl commands here are for development testing and demo purposes only. The dashboard "▶ Run Tick" button does the same thing without a terminal.

---

## Live Endpoints

| Endpoint | URL |
|---|---|
| Frontend | https://liquidmeshfi.xyz |
| Dashboard | https://liquidmeshfi.xyz/dashboard |
| Backend base | https://api.liquidmeshfi.xyz |
| Mesh status | GET `/mesh/status` |
| Mesh summary | GET `/mesh/summary` |
| Economy metrics | GET `/mesh/economy` |
| Agent balances | GET `/mesh/balances` |
| Trades | GET `/mesh/trades` |
| Signals | GET `/mesh/signals` |
| x402 payments | GET `/mesh/payments` |
| Run tick | POST `/mesh/tick` |
| Auto mode on | POST `/mesh/start` |
| Auto mode off | POST `/mesh/stop` |

---

## Step-by-Step Test

### Step 1 — Wake the backend

Render free tier sleeps after 15 minutes of inactivity. Always ping status first:

```bash
curl https://api.liquidmeshfi.xyz/mesh/status
```

Expected:
```json
{
  "success": true,
  "data": {
    "isRunning": false,
    "agents": [
      { "name": "Scout", "isRunning": false, "cycleCount": 0, "walletAddress": "0x..." },
      { "name": "Analyst", "isRunning": false, "cycleCount": 0, "walletAddress": "0x..." },
      { "name": "Executor", "isRunning": false, "cycleCount": 0, "walletAddress": "0x..." },
      { "name": "Orchestrator", "isRunning": false, "cycleCount": 0, "walletAddress": "0x..." }
    ]
  }
}
```

If you get a 502 or timeout, wait 10 seconds and try again (cold start).

---

### Step 2 — Verify executor wallet is funded

```bash
curl https://api.liquidmeshfi.xyz/mesh/balances
```

Expected: Executor shows OKB balance > 0:
```json
[
  { "name": "Scout", "okb": "0", "usdg": "0.084", "totalUsdValue": "0.08" },
  { "name": "Analyst", "okb": "0", "usdg": "0.001", "totalUsdValue": "0.00" },
  { "name": "Executor", "okb": "0.0988", "usdg": "0.084", "totalUsdValue": "8.34" },
  { "name": "Orchestrator", "okb": "0", "usdg": "0", "totalUsdValue": "0.00" }
]
```

If Executor `okb` is `"0"` → fund the wallet before proceeding.

---

### Step 3 — Trigger a tick

```bash
curl -X POST https://api.liquidmeshfi.xyz/mesh/tick
```

Or click **"▶ Run Tick"** in the dashboard.

The tick runs all 4 agents sequentially (~10–30 seconds). The response contains each agent's result:

```json
{
  "success": true,
  "data": [
    {
      "status": "fulfilled",
      "value": {
        "success": true,
        "message": "Signal stored: OKB (strength: 3)"
      }
    },
    {
      "status": "fulfilled",
      "value": {
        "success": true,
        "message": "Score: 67, recommendation: execute"
      }
    },
    {
      "status": "fulfilled",
      "value": {
        "success": true,
        "message": "Swap executed: 0.005 OKB → USDC",
        "data": { "txHash": "0x...", "score": 67 }
      }
    },
    {
      "status": "fulfilled",
      "value": {
        "success": true,
        "message": "Metrics aggregated",
        "data": { "totalUsdgEarned": 0.003, "earnSpendRatio": 0.0007 }
      }
    }
  ]
}
```

**Success signal: Executor message contains a `txHash`.**

---

### Step 4 — Verify on OKLink

Take the txHash from Step 3:

```
https://www.oklink.com/xlayer/tx/<txHash>
```

You should see:
- **From**: Executor wallet address
- **Method**: swap or aggregator call
- **Token transfer**: OKB out, USDC in (same wallet)
- **Status**: Success

---

### Step 5 — Verify x402 payments

```bash
curl https://api.liquidmeshfi.xyz/mesh/payments
```

Each payment record is a real USDG settlement on X Layer:
```json
[
  {
    "from_agent": "analyst",
    "to_endpoint": "/scout/signal",
    "amount_usdg": "0.001",
    "tx_hash": "0x...",
    "purpose": "signal"
  },
  {
    "from_agent": "executor",
    "to_endpoint": "/analyst/score",
    "amount_usdg": "0.002",
    "tx_hash": "0x...",
    "purpose": "score"
  }
]
```

Each `tx_hash` is verifiable on OKLink — these are real USDG transfers between agent wallets.

---

### Step 6 — Check the dashboard

Open https://liquidmeshfi.xyz/dashboard

After a successful tick you should see:

| Element | Expected |
|---|---|
| Agent cards | OKB + USDG balances (not `—`) |
| Executor card | Reduced OKB, increased USDC |
| Activity feed | Log entries from all 4 agents |
| Trade table | New row: token, txHash, status=success |
| Economy panel | USDG Earned > 0, Earn/Spend ratio visible |
| Cycle countdown | "Next cycle in Xm Ys · every 30min" |

---

### Step 7 — Check economy metrics

```bash
curl https://api.liquidmeshfi.xyz/mesh/economy
```

```json
{
  "success": true,
  "data": {
    "totalUsdgEarned": 0.003,
    "totalOkbSpent": 0.005,
    "earnSpendRatio": 0.0007,
    "lastTickAt": "2026-03-28T14:30:00Z",
    "nextCycleAt": "2026-03-28T15:00:00Z",
    "cycleIntervalMinutes": 30,
    "tradeCount": 1,
    "tradeSuccessRate": 1,
    "compoundHistory": []
  }
}
```

---

## Running Multiple Ticks (demo mode)

Run 2–3 ticks to build up dashboard activity before recording the demo video:

```bash
curl -X POST https://api.liquidmeshfi.xyz/mesh/tick
sleep 15
curl -X POST https://api.liquidmeshfi.xyz/mesh/tick
sleep 15
curl -X POST https://api.liquidmeshfi.xyz/mesh/tick
```

Or start auto mode — the mesh ticks every 30 minutes automatically:

```bash
# Start (runs every CHECK_INTERVAL_MINUTES)
curl -X POST https://api.liquidmeshfi.xyz/mesh/start

# Stop
curl -X POST https://api.liquidmeshfi.xyz/mesh/stop
```

---

## Common Failures & Fixes

| Symptom | Cause | Fix |
|---|---|---|
| Executor: "Waiting for score" | Analyst scored < 40 (skip) | Normal. Market conditions. Run tick again. |
| Executor: "Waiting for score" (repeated) | Analyst not seeing Scout signal | EventBus timing. Usually resolves on next tick. |
| "Price impact too high" | Route not available at this size | Already mitigated with 0.005 OKB. Check OKX DEX liquidity. |
| "Pre-transaction failed" | TEE auth expired OR insufficient OKB | Re-trigger tick (auto-renews) OR top up Executor wallet. |
| "x402 verify failed" | USDG balance too low on paying agent | Fund Analyst/Executor wallet with USDG on X Layer. |
| Render 502 | Cold start | Hit `/mesh/status` first, wait 10s, retry. |
| Dashboard balances show `—` | First balance fetch in progress | Wait 30s, refresh. Polls every 30s. |
| Dashboard shows no trades | No tick run yet, or all skipped | Run a tick manually. If all skip, signal quality is low — try again. |
| Build fails on Render | Missing env var | Check Render logs, compare against `.env.example`. |

---

## Submission Checklist

Collect these before submitting to the hackathon:

- [ ] **X Layer txHash** — from Executor tick response
  ```bash
  curl -X POST https://api.liquidmeshfi.xyz/mesh/tick | jq '.data[2].value.data.txHash'
  ```

- [ ] **x402 payment txHashes** — from `/mesh/payments`
  ```bash
  curl https://api.liquidmeshfi.xyz/mesh/payments | jq '.[].tx_hash'
  ```

- [ ] **Live frontend URL** — https://liquidmeshfi.xyz

- [ ] **Live API URL** — https://api.liquidmeshfi.xyz

- [ ] **GitHub repo** — public, with all source code

- [ ] **Demo video** showing:
  1. Landing page (`https://liquidmeshfi.xyz`) — sovereign agent economy narrative
  2. Dashboard — agent cards with live balances, economy panel
  3. Run Tick (button or curl)
  4. Tick response with txHash
  5. OKLink — swap confirmed on X Layer
  6. Dashboard refreshed — new trade row, USDG earned updated
