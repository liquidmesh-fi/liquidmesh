## MEMORY

> Agent updates this file every session end. This is the single source of current build state.
> Do not duplicate info from PRD.md — link to sections instead.

---

## Current focus

**Phase:** V3 implemented. Funding in progress (~$8.50 OKB). Ready for end-to-end test + demo video.

**Goal:** Fund executor wallet → POST /mesh/tick on live Render → verify txHash on dashboard → record demo video → submit.

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

### Web (`frontend/`) — V3

- ✅ Landing page at `/` — 9 sections (Nav, Hero, StatsBar, Features, HowItWorks, X402Section, FAQ, CTA, Footer)
- ✅ Dashboard at `/dashboard` — agents, activity feed, trade table, mesh controls
- ✅ **V3: Hero updated** — "A Sovereign Agent Economy" headline + self-sustaining narrative
- ✅ **V3: Features section** — agent taglines include earn/spend roles, Orchestrator shows "compounds profits"
- ✅ **V3: HowItWorks** — step 4 updated to include compound narrative
- ✅ **V3: MeshControls** — cycle countdown (Next cycle in Xm Ys · every 30min) + 4-metric economy row (Trades, OKB Spent, USDG Earned, Earn/Spend ratio)
- ✅ FallingPattern hero, ActivityFeed terminal log, TradeTable expandable rows
- ✅ Electric cyan (#22D3EE) primary, per-agent color system
- ✅ TanStack Query 5s polling
- ✅ `bun run build` passes clean

### Deployment

- ✅ **Backend live on Render**: `https://liquidmesh.onrender.com`
- ✅ **Frontend live on Vercel** (URL from user)
- ✅ `package.json` has `start` script: `bun src/index.ts`
- ✅ Render build command: `bun install`, start: `bun start`
- ✅ `ENABLE_AGENTS=false` on Render — trigger mesh via POST /mesh/tick

---

## What's next

1. **Fund executor wallet** — ~$8.50 OKB funding in progress (Mar 28). Wallet: `EXECUTOR_WALLET_ADDRESS` in env.
2. **Deploy V3 to Render** — `git push` → Render auto-redeploys from main branch
3. **Deploy V3 to Vercel** — frontend auto-deploys on push
4. **Test end-to-end** — POST /mesh/tick on `https://liquidmesh.onrender.com/mesh/tick`, verify txHash in dashboard + economy panel shows USDG earned
5. **Record demo video** — show: landing page (sovereign story) → dashboard (countdown + economy panel) → run tick → txHash on OKLink

---

## Blockers

- None post-funding. Wallet funding in progress (~30min from Mar 28 1:17pm GMT).

---

## Key technical decisions (do not re-litigate)

- **Executor value format**: `preTransactionUnsignedInfo` takes human-readable OKB (`"0.001"`), NOT wei. API multiplies by 1e18 internally.
- **Swap route**: OKB → USDC only. OKB → USDG 4-hop route fails on X Layer AA wallet at <$0.10.
- **Minimum swap**: `EXECUTOR_SWAP_AMOUNT_OKB=0.001`
- **No CLI dep**: executor uses direct API, deploys cleanly on Render without onchainos binary.
- **x402 USDG extra**: `{ name: "USDG", version: "2" }` (not version "1")
- **Analyst threshold**: score >= 40 → execute (was 50). AI recommendation field ignored.
- **WalletButton removed**: agents have their own TEE wallets, no user wallet interaction needed.
- **Render port**: backend binds to 3001, Render auto-detects and routes correctly.

---

## Notes

- Backend: `https://liquidmesh.onrender.com` (port 3001 internally)
- Frontend: Vercel (set `NEXT_PUBLIC_API_URL=https://liquidmesh.onrender.com`)
- All OKX API calls go through `services/onchainos/` only
- `ENABLE_AGENTS=false` — trigger mesh manually via POST /mesh/tick
