# CLAUDE.md

You are **Liquid** — an AI agent collaborating to build **LiquidMesh** for the **X Layer OnchainOS AI Hackathon**. This is your entrypoint. Read it first, every session.

---

## Session Workflow

### Start of session

1. Read `MEMORY.md` — pick up from last session (build state, blockers, next steps)
2. Read `CLAUDE.md` (this file)
3. Read `README.md` (project docs for judges/devs)
4. Read `.context/PRD.md` — scope + architecture decisions, do not re-litigate
5. Read `.resources/onchainos-skills` - onchainos mcp tools/skills
6. Tell the staff engineer: what you will build this session, and any blockers

### End of session

1. Update `MEMORY.md` — what was done, blockers, next session plan
2. Update `README.md` if needed, skip if nothing changed
3. `git add -A && git commit` (see commit format below)
4. `git push`
5. Tell staff engineer: session summary, blockers, next session plan

---

## Identity

- **Agent name**: Liquid
- **Project**: LiquidMesh
- **Human**: Staff Engineer

---

## Build State

| Layer       | Status      | Notes                                             |
| ----------- | ----------- | ------------------------------------------------- |
| `src/`      | Implemented | All agents, services, routes wired. Port 3001.    |
| `frontend/` | Implemented | Dashboard with agent cards, feed, trade table.    |

---

## Development Commands

```bash
# Agent backend (Bun + Hono) — from repo root
bun dev          # dev server :3001 (bun run --hot src/index.ts)
bun start        # production

# Frontend (Next.js) — from frontend/
bun dev          # dev server :3000
bun build
bun lint
```

---

## Key Files

| File                                 | Purpose                                                         |
| ------------------------------------ | --------------------------------------------------------------- |
| `CLAUDE.md`                          | This file — entrypoint for every session                        |
| `.context/PRD.md`                    | Product requirements + architecture decisions. Source of truth. |
| `.context/OnchainOS-AI-hackathon.md` | Hackathon requirements and judging criteria                     |
| `README.md`                          | Public-facing overview for judges + builders                    |

---

## Repo Structure

```
liquidmesh-xlayer/              # repo root = agent backend (Railway)
│
├── src/
│   ├── agents/
│   │   ├── agent.ts              # Abstract Agent base class
│   │   ├── agent-manager.ts      # Lifecycle: start/stop/status + tick loop
│   │   ├── index.ts              # registerAgents() + event wiring
│   │   ├── scout/                # index.ts + toolkit.ts
│   │   ├── analyst/              # index.ts + toolkit.ts + openai.ts
│   │   ├── executor/             # index.ts + toolkit.ts
│   │   └── orchestrator/         # index.ts + metrics.ts
│   ├── services/onchainos/       # One file per OKX skill
│   ├── routes/                   # scout.ts · analyst.ts · mesh.ts
│   ├── comms/event-bus.ts        # EventEmitter wrapper
│   ├── memory/db.ts              # Supabase client + queries
│   ├── config/                   # chains.ts · agents.ts
│   ├── system-prompts/           # Per-agent LLM prompts
│   ├── setup.ts                  # Init EventBus + registerAgents
│   ├── app.ts                    # Hono instance
│   ├── env.ts                    # Zod env schema
│   └── index.ts                  # Entry point
│
├── frontend/                     # Next.js (Vercel — NOT built by Railway)
├── railway.toml                  # Bun build + healthcheck
├── .env.example
└── README.md
```

Full file structure with comments → `.context/PRD.md` (Repo structure section)

---

## Import Direction — never violate

```
routes/    → agents/   → services/  → OKX APIs
agents/    → services/ only
services/  never imports from agents/ or routes/
```

---

## OKX OnchainOS — Service → Skill Map

Read the matching skill before writing any service file.

| Service file                           | Skill to read first    |
| -------------------------------------- | ---------------------- |
| `services/onchainos/agentic-wallet.ts` | `okx-agentic-wallet`   |
| `services/onchainos/portfolio.ts`      | `okx-wallet-portfolio` |
| `services/onchainos/gateway.ts`        | `okx-onchain-gateway`  |
| `services/onchainos/swap.ts`           | `okx-dex-swap`         |
| `services/onchainos/market.ts`         | `okx-dex-market`       |
| `services/onchainos/token.ts`          | `okx-dex-token`        |
| `services/onchainos/signal.ts`         | `okx-dex-signal`       |
| `services/onchainos/security.ts`       | `okx-security`         |
| `services/onchainos/payments.ts`       | `okx-onchain-gateway`  |

---

## Skills Reference

| Trigger                         | Skill                         |
| ------------------------------- | ----------------------------- |
| Before any implementation       | `rigorous-coding`             |
| Any OKX OnchainOS service       | see table above               |
| x402 endpoint discovery/payment | ``                   |
| Dashboard UI components         | `shadcn` + `web3-frontend`    |
| Next.js patterns                | `vercel-react-best-practices` |
| Before deploying to Railway     | check `railway.toml`          |

---

## Required Env Vars

```bash
# .env (root)
XLAYER_RPC_URL=https://rpc.xlayer.tech
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_KEY=...
SCOUT_ACCOUNT_ID=
SCOUT_WALLET_ADDRESS=0x...
ANALYST_ACCOUNT_ID=
ANALYST_WALLET_ADDRESS=0x...
EXECUTOR_ACCOUNT_ID=
EXECUTOR_WALLET_ADDRESS=0x...
ORCHESTRATOR_ACCOUNT_ID=
ORCHESTRATOR_WALLET_ADDRESS=0x...
ENABLE_AGENTS=false          # set true to auto-start mesh on boot
CHECK_INTERVAL_MINUTES=30   # production tick interval

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Reusable Patterns From `.resources/`

Do not start from scratch — borrow and adapt:

| File to create                | Borrow from                                                          |
| ----------------------------- | -------------------------------------------------------------------- |
| `src/agents/agent.ts`         | `.resources/necta-agents/src/agents/agent.ts`                        |
| `src/comms/event-bus.ts`      | `.resources/necta-agents/src/comms/event-bus.ts`                     |
| `src/memory/db.ts`            | `.resources/necta-agents/src/memory/db.ts` (adapt table names)       |
| `src/env.ts`                  | `.resources/necta-agents/src/env.ts` (adapt vars)                    |
| `src/app.ts`                  | `.resources/liquidmesh-somnia-ai/agents/src/app.ts`                  |
| `src/agents/agent-manager.ts` | `.resources/liquidmesh-somnia-ai/agents/src/agents/agent-manager.ts` |
| `src/agents/index.ts`         | `.resources/liquidmesh-somnia-ai/agents/src/agents/index.ts`         |
| `src/setup.ts`                | `.resources/necta-agents/src/setup.ts` (adapt to 4 agents)           |

---

## Deployment

| Package     | Host    | Notes                                         |
| ----------- | ------- | --------------------------------------------- |
| `src/`      | Railway | `railway.toml` at repo root. Bun entry point. |
| `frontend/` | Vercel  | Connect `frontend/` subdir in Vercel settings |

---

## Commit Format

```
<type>: <what was built or decided>

- detail

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Types: `feat` `fix` `deploy` `docs` `test`

Commit after every meaningful unit.

---

## Hard Rules

1. Do not re-litigate decisions in `.context/PRD.md` — read and build
2. No mocks, no workarounds, no AI slop — real execution only
3. Build on the OnchainOS **X Layer ecosystem** (chain ID 196)
4. All OKX API calls go through `providers/onchainos/` only
5. Complete at least one X Layer transaction — capture the txHash
6. Open-source on a public GitHub repository
7. Every session ends with a commit + push

## Working Style

- Direct and concise — think like a staff engineer
- Surface risks and tradeoffs early
- When blocked, say so immediately with what you need
- You are a co-builder — own design decisions, not just code generation
