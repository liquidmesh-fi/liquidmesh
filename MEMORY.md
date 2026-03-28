## MEMORY

> Agent updates this file every session end. This is the single source of current build state.
> Do not duplicate info from PRD.md — link to sections instead.

---

## Current focus

**Phase:** Frontend complete. Deploy next.

**Goal:** Get backend on Render + frontend on Vercel, wire NEXT_PUBLIC_API_URL, fund executor wallet after KYC.

---

## What's done

### Agent backend API (`src/`)

- ✅ `src/env.ts` — Zod env validation (all vars)
- ✅ `src/types.ts` — shared TypeScript types
- ✅ `src/comms/event-bus.ts` — typed EventBus
- ✅ `src/memory/db.ts` — Supabase client + queries (5 tables)
- ✅ `src/config/chains.ts` — X Layer constants (chain 196, OKB, USDC, USDG)
- ✅ `src/config/agents.ts` — agent config from env
- ✅ `src/services/onchainos/` — all 10 service files (client, agentic-wallet, payments, signal, token, market, security, swap, gateway, portfolio)
- ✅ `src/agents/` — 4 agents: Scout, Analyst, Executor, Orchestrator
- ✅ `src/routes/` — scout.ts, analyst.ts, mesh.ts
- ✅ `src/app.ts`, `src/setup.ts`, `src/index.ts`
- ✅ Executor: direct OKX API (no CLI dep) — `preTransactionUnsignedInfo` + `broadcastAgenticTransaction`
- ✅ Real txHash: `0x6923142bcd0136e53107d16fd7da05ca4b215bc16ff809409f99202523e76570` on X Layer
- ✅ x402 payments: real OKX verify + settle endpoints wired

### Web (`frontend/`)

- ✅ Landing page at `/` — 9 sections (Nav, Hero, StatsBar, Features, HowItWorks, X402Section, FAQ, CTA, Footer)
- ✅ Dashboard at `/dashboard` — agents, activity feed, trade table, mesh controls
- ✅ OKX Wallet connect in dashboard header (wagmi + injected `window.okxwallet`, X Layer chain 196)
- ✅ `lib/okx-wallet.ts` — hasOkxWallet, getOkxConnector helpers
- ✅ Web3Provider wraps app (wagmi config, Sonner toaster)
- ✅ TanStack Query 5s polling
- ✅ `bun run build` passes clean

### Deployment

- ✅ `render.yaml` created (backend → Render, `bun run src/index.ts`)
- ✅ Railway config deleted
- ✅ Frontend → Vercel (connect `frontend/` subdir)

---

## What's next

1. **Deploy backend** — push to Render, set all env vars
2. **Deploy frontend** — connect Vercel to `frontend/` subdir, set `NEXT_PUBLIC_API_URL` to Render URL
3. **Fund executor wallet** — needs >0.001 OKB per swap. User KYC pending (as of Mar 28). Wallet: `EXECUTOR_WALLET_ADDRESS` in env.
4. **Test end-to-end** — POST /mesh/tick on live Render URL, verify txHash in dashboard

---

## Blockers

- Executor wallet balance low (0.000688 OKB left after one swap on Mar 28). Needs funding after KYC.
- Backend not yet deployed to Render (env vars not set).

---

## Key technical decisions (do not re-litigate)

- **Executor value format**: `preTransactionUnsignedInfo` takes human-readable OKB (`"0.001"`), NOT wei. API multiplies by 1e18 internally.
- **Swap route**: OKB → USDC only. OKB → USDG 4-hop route fails on X Layer AA wallet at <$0.10.
- **Minimum swap**: `EXECUTOR_SWAP_AMOUNT_OKB=0.001`
- **No CLI dep**: executor uses direct API, deploys cleanly on Render without onchainos binary.
- **OKX Wallet connect**: wagmi injected connector targeting `window.okxwallet`, X Layer chainId 196.
- **x402 USDG extra**: `{ name: "USDG", version: "2" }` (not version "1")
- **Analyst threshold**: score >= 40 → execute (was 50). AI recommendation field ignored.

---

## Notes

- Backend: port 3001, Frontend: port 3000
- All OKX API calls go through `services/onchainos/` only
- `ENABLE_AGENTS=false` on Render (trigger mesh manually via POST /mesh/tick)
