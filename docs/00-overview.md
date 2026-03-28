# LiquidMesh — Overview

## What Is LiquidMesh?

LiquidMesh is an **autonomous multi-agent trading economy** on X Layer (chainId 196). It is not a trading bot. It is four sovereign AI agents — each with an OKX TEE-secured wallet — that form a self-sustaining economic mesh where agents earn by selling intelligence, spend to acquire it, execute real onchain swaps, and compound profits without any human intervention.

**Live:** https://liquidmeshfi.xyz
**API:** https://api.liquidmeshfi.xyz
**Chain:** X Layer (OKB, chainId 196)
**Built for:** X Layer OnchainOS AI Hackathon

---

## The Problem

Autonomous trading on a new chain like X Layer requires three simultaneous capabilities running in coordination:

1. **Signal detection** — knowing which tokens have real smart money interest
2. **Risk evaluation** — filtering honeypots, illiquid tokens, and high-risk opportunities
3. **Execution** — actually signing and broadcasting a swap on X Layer

Single-agent systems hardcode all three into one process. That creates a bottleneck: the agent can't specialize, can't be independently upgraded, and can't prove that each decision was made with proper intelligence.

---

## The Solution

LiquidMesh separates each concern into a **sovereign agent** — an independent process with its own wallet, its own revenue stream, and its own accountability.

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE AGENT ECONOMY                            │
│                                                                 │
│   Scout          Analyst         Executor       Orchestrator    │
│  ┌──────┐  x402 ┌────────┐ x402 ┌──────────┐  ┌─────────────┐ │
│  │ TEE  │──────▶│  TEE   │──────▶│   TEE    │  │    TEE      │ │
│  │wallet│       │ wallet │       │  wallet  │  │   wallet    │ │
│  └──────┘       └────────┘       └──────────┘  └─────────────┘ │
│  Earns USDG   Pays+Earns USDG  Pays USDG,      Governs mesh,   │
│  sells signal  scores+sells    executes swap    compounds       │
└─────────────────────────────────────────────────────────────────┘
```

Each agent:
- Has a **dedicated OKX TEE Agentic Wallet** — hardware-secured, non-custodial
- Has a **defined revenue model** — earns USDG by selling intelligence to the next agent
- Operates **independently** — if one fails, the others continue
- Is **accountable** — every payment, every trade, every decision is recorded on X Layer

---

## The Key Innovation: x402 Inter-Agent Payments

Every piece of intelligence is protected by the **x402 payment protocol**. When Analyst wants Scout's signal, it must pay for it — a real USDG transfer on X Layer settled via OKX. No payment, no data.

This creates a genuine **machine-to-machine economy**:

```
Agent A wants data from Agent B
→ Agent B returns HTTP 402 (Payment Required)
→ Agent A signs an EIP-3009 USDG transfer via OKX TEE
→ Agent A replays the request with payment in the HTTP header
→ Agent B verifies + settles on X Layer via OKX x402 API
→ Agent B returns the data + settlement txHash
```

This is not simulated. Every x402 settlement is a real USDG transfer on X Layer, verifiable on OKLink.

---

## The Economy Loop

```
Every 30 minutes (one cycle):

Scout
 └─ Detects signal on X Layer (OKX smart money + hot-token APIs)
 └─ Earns USDG when Analyst buys the signal

Analyst
 └─ Pays Scout → scores the signal with GPT-4o + OKX security APIs
 └─ Earns USDG when Executor buys the scored opportunity

Executor
 └─ Pays Analyst → executes OKB→USDC swap on X Layer DEX
 └─ Real txHash returned, verifiable on OKLink

Orchestrator
 └─ Tracks earn/spend ratio across all agents
 └─ When surplus USDG accumulates → logs compound event
 └─ Surfaces economy metrics to dashboard
```

The mesh is designed to be **self-sustaining**: x402 earnings from Scout and Analyst flow back into the system, while Executor's swap value stays in the wallet (OKB → USDC, same address).

---

## Live Proof

Real X Layer swap executed by the Executor agent:

**`0x6923142bcd0136e53107d16fd7da05ca4b215bc16ff809409f99202523e76570`**

[View on OKLink →](https://www.oklink.com/xlayer/tx/0x6923142bcd0136e53107d16fd7da05ca4b215bc16ff809409f99202523e76570)

---

## Hackathon Qualification

| Requirement | Status |
|---|---|
| Builds on X Layer ecosystem | ✅ chainId 196, OKB native, USDC on X Layer |
| x402 agentic payments | ✅ EIP-3009 USDG micropayments between agents |
| Real X Layer transaction | ✅ `0x6923142bcd…` on OKLink |
| Multi-agent collaboration | ✅ 4 sovereign agents with independent TEE wallets |
| Open-source | ✅ Public GitHub repository |

---

## Docs Index

| File | Contents |
|---|---|
| `00-overview.md` | This file — what, why, and how |
| `01-architecture.md` | System design, agent internals, data flow, DB schema |
| `02-setup.md` | Local dev, OKX wallet setup, deployment |
| `03-testing.md` | How to test end-to-end, API reference, troubleshooting |
