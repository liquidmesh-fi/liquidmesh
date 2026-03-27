## MEMORY

> Agent updates this file every session end. This is the single source of current build state.
> Do not duplicate info from PRD.md — link to sections instead.

---

## Current focus

**Phase:** Core implementation complete. Integration + testing next.

**Goal (48 hours):** Working demo with live X Layer transactions: Scout detects signal → Analyst scores → Executor swaps OKB→USDG → txHash captured.

---

## What's done

### Agent backend API (`src/`)

- ✅ `src/env.ts` — Zod env validation (all vars)
- ✅ `src/types.ts` — shared TypeScript types
- ✅ `src/comms/event-bus.ts` — typed EventBus (mesh:tick, signal:ready, score:ready, trade:done, budget:alert, agent:error)
- ✅ `src/memory/db.ts` — Supabase client + queries (5 tables: signals, scores, trades, payments, metrics)
- ✅ `src/config/chains.ts` — X Layer constants (chain 196, OKB, USDG)
- ✅ `src/config/agents.ts` — agent config from env
- ✅ `src/services/onchainos/` — all 10 service files:
  - `client.ts` — OKX HMAC signing + okxFetch
  - `agentic-wallet.ts` — TEE session, balance, broadcast
  - `payments.ts` — x402 probe/sign/settle/verify
  - `signal.ts` — smart money signal API
  - `token.ts` — trending tokens (fallback)
  - `market.ts` — price data
  - `security.ts` — token security scan
  - `swap.ts` — quote + build swap tx
  - `gateway.ts` — simulate + broadcast + status
  - `portfolio.ts` — wallet balances
- ✅ `src/agents/agent.ts` — abstract Agent base class
- ✅ `src/agents/agent-manager.ts` — lifecycle + tick loop + runOnce()
- ✅ `src/agents/scout/` — Signal detection + trending fallback
- ✅ `src/agents/analyst/` — OpenAI scoring + x402 payment to Scout
- ✅ `src/agents/executor/` — Swap execution + x402 payment to Analyst
- ✅ `src/agents/orchestrator/` — Metrics aggregation + budget monitoring
- ✅ `src/agents/index.ts` — registerAgents + startMesh + getMeshStatus
- ✅ `src/system-prompts/` — per-agent LLM prompts
- ✅ `src/routes/scout.ts` — x402-protected /scout/signal
- ✅ `src/routes/analyst.ts` — x402-protected /analyst/score
- ✅ `src/routes/mesh.ts` — /mesh/status|start|stop|trades|signals|payments|summary|tick
- ✅ `src/app.ts` — Hono app with CORS
- ✅ `src/setup.ts` — init + conditional mesh start
- ✅ `src/index.ts` — entry point (port 3001)
- ✅ TypeScript: clean (0 src/ errors)
- ✅ Backend port: 3001

### Web (`frontend/`)

- ✅ TanStack Query installed + configured (5s polling)
- ✅ `lib/api.ts` — typed API client
- ✅ `_components/providers.tsx` — QueryClientProvider
- ✅ `_components/agent-card.tsx` — agent status card with wallet address
- ✅ `_components/activity-feed.tsx` — live merged feed (trades + signals + payments)
- ✅ `_components/trade-table.tsx` — trade history with status badges
- ✅ `_components/mesh-controls.tsx` — start/stop + summary metrics
- ✅ `_components/dashboard.tsx` — main layout: header + controls + agent grid + feed + table
- ✅ Dark theme (#080b0f), Tailwind v4, no shadcn needed

---

## What's next

1. **Supabase schema** — create the 5 tables (signals, scores, trades, payments, metrics) in Supabase dashboard
2. **Set up env** — copy .env.example, fill in real OKX API key + sub-account IDs + Supabase + OpenAI
3. **Test locally** — `bun dev` (backend :3001) + `cd frontend && bun dev` (frontend :3000)
4. **End-to-end test** — hit POST /mesh/tick to trigger one full cycle, verify txHash captured
5. **Railway deploy** — push to GitHub, connect Railway to repo root
6. **Vercel deploy** — connect `frontend/` subdirectory

---

## Blockers

- Supabase tables not created yet (need to run migrations manually via dashboard or SQL)
- OKX sub-account IDs not provisioned yet (need real API key + 4 sub-account creation)
- Executor uses demo txHash (prefixed `demo-`) — wire real TEE signing when wallets are ready

---

## Notes

- Backend: port 3001, Frontend: port 3000 (standard Next.js)
- x402 sign is simplified for demo — full TEE signing via OKX agentic wallet ready to wire in
- Executor swap simulation path works; real broadcast needs funded TEE wallets
- All OKX API calls go through `services/onchainos/` only (no direct calls in agents)
