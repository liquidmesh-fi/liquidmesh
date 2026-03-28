"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { motion } from "motion/react";
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  GitBranch,
  Radar,
  BarChart3,
  Zap,
  Network,
  ExternalLink,
  Shield,
  Activity,
  Check,
} from "lucide-react";
import { FallingPattern } from "./ui/falling-pattern";

// ─── Nav ────────────────────────────────────────────────────────────────────

export function LandingNav() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="fixed top-0 z-50 w-full px-4">
      <nav
        className="mx-auto mt-3 max-w-7xl px-6 bg-[#0d1117]/90 backdrop-blur-xl rounded-2xl border border-white/8 shadow-xl"
      >
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/icon.png"
              alt="LiquidMesh"
              width={28}
              height={28}
              className="rounded-lg"
              priority
            />
            <span className="text-base font-semibold text-white">
              LiquidMesh
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/dashboard"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-400 text-black text-sm font-semibold hover:bg-cyan-300 transition-colors"
          >
            Launch App
            <ArrowRight className="size-3.5" />
          </Link>

          <button
            type="button"
            className="md:hidden text-white/60 p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </button>
        </div>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-6 space-y-4"
          >
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="block text-sm text-white/60 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="block w-full text-center px-5 py-2.5 rounded-lg bg-cyan-400 text-black text-sm font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              Launch App
            </Link>
          </motion.div>
        )}
      </nav>
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#080b0f]">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <FallingPattern
          color="rgba(255,255,255,1)"
          backgroundColor="#080b0f"
          blurIntensity="1em"
          duration={120}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-8"
        >
          <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Built on X Layer · OKX OnchainOS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-tight drop-shadow-2xl"
        >
          A Sovereign <br />
          Multi-Agent <br className="hidden md:block" />
          Trading Economy
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed"
        >
          Four autonomous AI agents — each with a TEE wallet — that earn, spend, trade, and compound profits entirely onchain. Multi-agent orchestration execution. No human in the loop. The mesh funds itself.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-xl bg-cyan-400 text-black text-base font-semibold hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-900/30"
          >
            Launch the Mesh
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

const STATS = [
  { label: "Chain", value: "X Layer", icon: "/x-layer-black.png" },
  { label: "Agents", value: "4 Agents", icon: "/agent.png" },
  { label: "Payments ", value: "x402 Protocol", icon: "/x402.png" },
  { label: "API Provider", value: "OKX OnchainOS", icon: "/x-layer-white.png" },
  { label: "Wallet", value: "OKX Agentic Wallet", icon: "/okxwallet.png" },
];

export function StatsBar() {
  return (
    <div className="border-y border-white/6 bg-[#0d1117] py-5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center md:justify-between gap-6 md:gap-0">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2.5"
            >
              <Image
                src={s.icon}
                alt={s.label}
                width={22}
                height={22}
                className="object-contain shrink-0"
              />
              <div>
                <p className="text-xs text-white/30">{s.label}</p>
                <p className="text-sm font-semibold text-white/80">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

const AGENTS = [
  {
    Icon: Radar,
    name: "Scout",
    tagline: "Signal Detection · Earns USDG",
    description:
      "Monitors X Layer using OKX smart money signal and hot-token APIs. Detects whale moves, trending tokens, and unusual volume. Sells signals via x402 — earns USDG every time Analyst pays.",
    apis: ["hot-token", "dex-signal", "token-trending"],
    color: "cyan",
  },
  {
    Icon: BarChart3,
    name: "Analyst",
    tagline: "Risk Scoring · Pays + Earns",
    description:
      "Pays Scout for signals via x402. Runs OKX security scans, holder concentration checks, and GPT-4o risk scoring. Publishes scored opportunities behind its own x402 endpoint — earns from Executor.",
    apis: ["dex-security", "token-advanced", "dex-quote"],
    color: "blue",
  },
  {
    Icon: Zap,
    name: "Executor",
    tagline: "Autonomous Execution · Pays to Trade",
    description:
      "Pays Analyst for scores ≥ 40 via x402. Builds OKB → USDC swap calldata via OKX DEX Aggregator. Signs with OKX TEE Agentic Wallet and broadcasts to X Layer. Every trade returns a verifiable txHash.",
    apis: ["dex-aggregator", "agentic-wallet", "x402-settle"],
    color: "violet",
  },
  {
    Icon: Network,
    name: "Orchestrator",
    tagline: "Economy Governance · Compounds Profits",
    description:
      "Monitors the full agent economy every cycle. Tracks earn/spend ratio across all agents. When the mesh shows surplus USDG earnings, Orchestrator compounds them back into OKB capital — growing the trading base without human top-ups.",
    apis: ["wallet-portfolio", "wallet-history", "metrics"],
    color: "amber",
  },
];

const colorMap: Record<
  string,
  { card: string; icon: string; dot: string }
> = {
  cyan: {
    card: "border-cyan-500/20 hover:border-cyan-500/35",
    icon: "bg-cyan-500/15 text-cyan-400",
    dot: "bg-cyan-400",
  },
  blue: {
    card: "border-blue-500/20 hover:border-blue-500/35",
    icon: "bg-blue-500/15 text-blue-400",
    dot: "bg-blue-400",
  },
  violet: {
    card: "border-violet-500/20 hover:border-violet-500/35",
    icon: "bg-violet-500/15 text-violet-400",
    dot: "bg-violet-400",
  },
  amber: {
    card: "border-amber-500/20 hover:border-amber-500/35",
    icon: "bg-amber-500/15 text-amber-400",
    dot: "bg-amber-400",
  },
};

export function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white tracking-tight">
            Four Sovereign Agents. One Economy.
          </h2>
          <p className="mt-4 text-lg text-white/40 max-w-2xl mx-auto">
            Each agent earns by selling intelligence and spends to acquire it. Together they form a self-sustaining multi-agent economy — no external funding required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {AGENTS.map((agent, i) => {
            const c = colorMap[agent.color];
            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border bg-[#0d1117] p-7 transition-all duration-200 group hover:shadow-[0_0_40px_rgba(0,0,0,0.4)] ${c.card}`}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div
                    className={`size-12 rounded-xl ${c.icon} flex items-center justify-center shrink-0`}
                  >
                    <agent.Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-white/40">{agent.tagline}</p>
                  </div>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-5">
                  {agent.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    Icon: Radar,
    title: "Scout detects a signal",
    description:
      "OKX smart money and hot-token APIs surface high-strength signals on X Layer. Scout stores the signal in Supabase and makes it available behind an x402 paywall — earning USDG each time Analyst buys.",
    color: "cyan",
  },
  {
    n: "02",
    Icon: BarChart3,
    title: "Analyst pays Scout and scores",
    description:
      "Analyst sends an EIP-3009 USDG transfer signed by its OKX TEE wallet. Scout settles on-chain via OKX x402 API. Analyst runs OKX security + holder checks and scores the signal with GPT-4o.",
    color: "blue",
  },
  {
    n: "03",
    Icon: Zap,
    title: "Executor pays Analyst and trades",
    description:
      "Score ≥ 40 triggers execution. Executor pays Analyst via x402, builds OKB → USDC swap calldata from OKX DEX Aggregator, signs via TEE, and broadcasts to X Layer. Real txHash on OKLink.",
    color: "violet",
  },
  {
    n: "04",
    Icon: Network,
    title: "Orchestrator governs and compounds",
    description:
      "Orchestrator aggregates earn/spend metrics across all agents. When surplus USDG earnings accumulate above threshold, it compounds them back into OKB capital — keeping the mesh self-sustaining cycle after cycle.",
    color: "amber",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-white/1">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white tracking-tight">
            One Cycle. Four Agents. Self-Sustaining.
          </h2>
          <p className="mt-4 text-lg text-white/40 max-w-xl mx-auto">
            Every 30 minutes, the mesh runs a full orchestration cycle — from signal detection to trade execution to profit compounding.
          </p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const c = colorMap[step.color];
            return (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`flex gap-5 p-6 rounded-2xl border bg-[#0d1117] transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,0,0,0.4)] ${c.card}`}
              >
                <div
                  className={`shrink-0 size-12 rounded-xl ${c.icon} flex items-center justify-center`}
                >
                  <step.Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-mono font-bold ${c.dot} opacity-60`} style={{ color: 'inherit' }}>
                      {step.n}
                    </span>
                    <h3 className="text-base font-semibold text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── x402 Section ────────────────────────────────────────────────────────────

export function X402Section() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-6">
              <Shield className="size-3" />
              x402 Protocol
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight mb-6">
              Agents pay agents.
              <br />
              Onchain. Every time.
            </h2>
            <p className="text-white/50 leading-relaxed mb-6">
              Every piece of intelligence in LiquidMesh is behind an x402
              paywall. When an agent wants data, it signs an EIP-3009 USDG
              transfer using its OKX TEE wallet and sends it in the HTTP header.
              The server calls OKX to verify and settle — no escrow, no
              intermediary, real on-chain settlement.
            </p>
            <div className="space-y-3">
              {[
                "Scout's signal endpoint: 0.001 USDG",
                "Analyst's score endpoint: 0.002 USDG",
                "All settlement via OKX /api/v6/x402/settle",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-white/60"
                >
                  <Check className="size-3.5 text-cyan-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-[#0d1117] p-6 font-mono text-xs space-y-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            <div className="text-white/30 mb-4">{"// x402 payment flow"}</div>
            <div>
              <span className="text-violet-400">Analyst</span>{" "}
              <span className="text-white/30">→</span>{" "}
              <span className="text-white/60">GET /scout/signal</span>
            </div>
            <div className="pl-4 text-white/30">← 402 Payment Required</div>
            <div className="pl-4 text-white/30">
              {"← X-Payment-Required: {scheme, maxAmount, payTo}"}
            </div>
            <div className="h-px bg-white/5" />
            <div>
              <span className="text-violet-400">Analyst</span>{" "}
              <span className="text-white/30">→</span>{" "}
              <span className="text-white/60">gen-msg-hash</span>{" "}
              <span className="text-white/30">(OKX TEE)</span>
            </div>
            <div>
              <span className="text-violet-400">Analyst</span>{" "}
              <span className="text-white/30">→</span>{" "}
              <span className="text-white/60">HPKE decrypt + Ed25519 sign</span>
            </div>
            <div>
              <span className="text-violet-400">Analyst</span>{" "}
              <span className="text-white/30">→</span>{" "}
              <span className="text-white/60">GET /scout/signal</span>
            </div>
            <div className="pl-4 text-white/30">
              X-Payment: base64(EIP-3009 payload)
            </div>
            <div className="h-px bg-white/5" />
            <div>
              <span className="text-cyan-400">Scout</span>{" "}
              <span className="text-white/30">→</span>{" "}
              <span className="text-white/60">OKX /api/v6/x402/verify</span>
            </div>
            <div>
              <span className="text-cyan-400">Scout</span>{" "}
              <span className="text-white/30">→</span>{" "}
              <span className="text-white/60">OKX /api/v6/x402/settle</span>
            </div>
            <div className="pl-4 text-cyan-400">← txHash: 0xabc…</div>
            <div className="h-px bg-white/5" />
            <div className="text-cyan-400">← 200 OK + signal data</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Does this require KYC or a custodial account?",
    a: "No. Each agent wallet is an OKX TEE Agentic Wallet — hardware-secured, non-custodial. The private keys never leave the enclave. You authenticate with an API key, not a KYC flow.",
  },
  {
    q: "What tokens does the Executor trade?",
    a: "Currently OKB → USDC on X Layer DEX. The Scout discovers the highest signal-strength token from the OKX hot-token feed.",
  },
  {
    q: "What is x402?",
    a: "x402 is an HTTP payment protocol. A server returns a 402 status with payment requirements. The client signs an EIP-3009 transfer and includes it in the next request. The server calls OKX to settle on-chain. No wallets to connect, no pop-ups.",
  },
  {
    q: "How is this different from a regular trading bot?",
    a: "A trading bot is a single script. LiquidMesh is a sovereign agent economy — four independent agents, each with a TEE wallet, that earn revenue by selling intelligence and spend it to acquire better intelligence. The Orchestrator tracks the earn/spend ratio and compounds surplus profits back into trading capital. The mesh is designed to be self-sustaining.",
  },
  {
    q: "Is the code open source?",
    a: "Yes. Everything is on GitHub. Backend: Bun + Hono. Frontend: Next.js. No proprietary SDKs — just OKX OnchainOS APIs called over HTTPS.",
  },
];

export function FAQ() {
  const [open, setOpen] = React.useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6 bg-white/1">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white tracking-tight">FAQ</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/8 bg-[#0d1117] overflow-hidden hover:border-white/14 transition-colors"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-6 py-5 text-left text-sm font-medium text-white/80 hover:text-white transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {faq.q}
                <ChevronDown
                  className={`size-4 text-white/30 shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="px-6 pb-5 text-sm text-white/50 leading-relaxed border-t border-white/6 pt-4"
                >
                  {faq.a}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

export function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl border border-cyan-500/25 bg-[#0d1117] p-12 text-center overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]"
        >
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <FallingPattern
              color="rgba(255,255,255,1)"
              backgroundColor="#0d1117"
              blurIntensity="1em"
              duration={120}
            />
          </div>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-cyan-500/12 blur-[100px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
          </div>
          <div className="relative z-10">
            <Activity className="size-8 text-cyan-400/60 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
              Watch the economy run.
            </h2>
            <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
              Four sovereign agents. Real TEE wallets. Real swaps. Every 30 minutes on X Layer — earning, trading, and compounding.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-cyan-400 text-black text-base font-semibold hover:bg-cyan-300 transition-colors"
              >
                Open Dashboard
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer className="border-t border-white/6 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/icon.png"
            alt="LiquidMesh"
            width={20}
            height={20}
            className="rounded-md"
          />
          <span className="text-sm font-semibold text-white/80">
            LiquidMesh
          </span>
          <span className="text-white/20 text-sm">·</span>
          <span className="text-sm text-white/30">
            © {new Date().getFullYear()}
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-white/40">
          <span className="text-white/20">Powered by</span>
          <span className="text-white/60 font-medium">OKX OnchainOS</span>
          <span className="text-white/20">·</span>
          <span className="text-white/60 font-medium">X Layer</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/liquidmesh-fi/liquidmesh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
          >
            <GitBranch className="size-3.5" />
            GitHub
          </a>
          <a
            href="https://x.com/liquidmeshai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="size-3.5" />
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
