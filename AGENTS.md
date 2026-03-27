# AGENTS.md

This file provides guidance to WARP (warp.dev) and other AI coding agents when working with code in this repository.

## Session Protocol

At the **start** of every session:

1. Read `MEMORY.md` — current build state, last session summary, blockers
2. Read `CLAUDE.md` — identity, rules, key files map
3. Read `.context/PRD.md` — architecture source of truth (do not re-litigate decisions)
4. Read `.resources/onchainos-skills` - onchainos mcp tools/skills

At the **end** of every session:

1. Update `MEMORY.md` with what was done, blockers, and next session plan
2. Update `README.md` if anything changed
3. `git add -A && git commit` (see commit format below) then `git push`

## Development Commands

```bash
# Agent backend (Bun + Hono) — from repo root
bun dev          # hot-reload dev server on :3000
bun start        # production (bun run src/index.ts)

# Frontend (Next.js) — from frontend/
bun dev          # dev server on :3001
bun build
bun lint         # biome check
bun format       # biome format --write
```

No test suite is configured yet. Validate by running the dev server and hitting endpoints manually.

## Architecture Overview

LiquidMesh is a **multi-agent autonomous trading mesh** on X Layer (chain ID 196). Four agents — Scout, Analyst, Executor, Orchestrator — each hold their own OKX Agentic Wallet (TEE) and communicate via **x402 USDG micropayments** at every hop. All market data comes exclusively from OKX OnchainOS APIs.

### Agent pipeline

```
Scout → (x402 0.005 USDG) → Analyst → (x402 0.005 USDG) → Executor → Orchestrator
```

- **Scout**: Polls `okx-dex-signal`, `okx-dex-market`, `okx-dex-token` for smart money signals on X Layer. Publishes to `GET /scout/signal` (x402-protected).
- **Analyst**: Pays Scout, runs token safety + liquidity checks via `okx-dex-token` + `okx-security` + `okx-dex-swap`, passes structured JSON to OpenAI for 0–10 scoring. Publishes to `GET /analyst/score` (x402-protected).
- **Executor**: Pays Analyst, acts on scores ≥ 7. Simulates via `okx-onchain-gateway`, then executes OKB→USDG swap on X Layer via `okx-dex-swap`.
- **Orchestrator**: Owns budget, monitors all agent wallets via `okx-wallet-portfolio`, logs all txHashes to Supabase, exposes public `GET /mesh/status`.

### Import direction (never violate)

```
routes/ → agents/ → providers/ → OKX APIs
providers/ never imports from agents/ or routes/
```

### Key modules

| Path                          | Purpose                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `src/agents/agent.ts`         | Abstract base class (name, eventBus, handleEvent)                                |
| `src/agents/agent-manager.ts` | Lifecycle: start/stop/status + tick loop (setTimeout recursion)                  |
| `src/agents/index.ts`         | `registerAgents()` — init + event wiring                                         |
| `src/providers/onchainos/`    | All OKX OnchainOS calls — one file per skill                                     |
| `src/routes/`                 | HTTP endpoints: `/scout/signal`, `/analyst/score`, `/mesh/start`, `/mesh/status` |
| `src/comms/event-bus.ts`      | EventEmitter wrapper for inter-agent comms                                       |
| `src/memory/db.ts`            | Supabase client: thoughts, signals, trades, metrics tables                       |
| `src/config/chains.ts`        | X Layer chain def (ID 196) + viem config                                         |
| `src/config/agents.ts`        | Agent wallet addresses + fixed signal pricing                                    |
| `src/system-prompts/`         | Per-agent LLM system prompts                                                     |
| `src/env.ts`                  | Zod env schema — validated at startup                                            |
| `src/setup.ts`                | Initialises EventBus + `registerAgents()` + AgentManager                         |

### Frontend

`frontend/` is a Next.js 16 app deployed independently to Vercel (excluded from Railway build). Reads from `NEXT_PUBLIC_API_URL`. Main page is the Orchestrator survival dashboard (txHash feed, earn/spend per agent). Linting/formatting via Biome.

## OKX OnchainOS — Provider → Skill Map

Before writing or editing any provider file, read the corresponding skill:

| Provider file                           | Skill                  |
| --------------------------------------- | ---------------------- |
| `providers/onchainos/agentic-wallet.ts` | `okx-agentic-wallet`   |
| `providers/onchainos/portfolio.ts`      | `okx-wallet-portfolio` |
| `providers/onchainos/gateway.ts`        | `okx-onchain-gateway`  |
| `providers/onchainos/swap.ts`           | `okx-dex-swap`         |
| `providers/onchainos/market.ts`         | `okx-dex-market`       |
| `providers/onchainos/token.ts`          | `okx-dex-token`        |
| `providers/onchainos/signal.ts`         | `okx-dex-signal`       |
| `providers/onchainos/security.ts`       | `okx-security`         |
| `providers/onchainos/payments.ts`       | `okx-onchain-gateway`  |

## Required Environment Variables

```bash
# .env (root — agent backend)
XLAYER_RPC_URL=https://rpc.xlayer.tech
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=
SCOUT_WALLET_KEY=0x...
ANALYST_WALLET_KEY=0x...
EXECUTOR_WALLET_KEY=0x...
ORCHESTRATOR_WALLET_KEY=0x...
ENABLE_AGENTS=false          # true = auto-start mesh on boot
CHECK_INTERVAL_MINUTES=30

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Deployment

| Package     | Host    | Config                                                                                                 |
| ----------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `src/`      | Railway | `railway.toml` at repo root — `bun install` build, `bun run src/index.ts` start, `/health` healthcheck |
| `frontend/` | Vercel  | Connect `frontend/` subdir in Vercel project settings                                                  |

## Commit Format

```
<type>: <what was built or decided>

- detail

Co-Authored-By: Oz <oz-agent@warp.dev>
```

Types: `feat` `fix` `deploy` `docs` `test`. Commit after every meaningful unit.

## Hard Rules

1. Do not re-litigate decisions in `.context/PRD.md`
2. No mocks, no workarounds — real execution only
3. All data is from OKX OnchainOS APIs exclusively — no external data feeds
4. All OKX API calls go through `providers/onchainos/` only
5. Target X Layer (chain ID 196) for all onchain operations
6. Read `rigorous-coding` skill before any implementation task
7. invoke onchainos-skills for onchainos too for detailed file reference see `.@resources/onchainos-skills`
