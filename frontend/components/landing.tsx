"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
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
  Wallet,
  Activity,
  Check,
} from "lucide-react";

const LavaLamp = dynamic(
  () => import("./ui/fluid-blob").then((m) => m.LavaLamp),
  { ssr: false },
);

// ─── Nav ────────────────────────────────────────────────────────────────────

export function LandingNav() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
    {
      label: "GitHub",
      href: "https://github.com/liquidmesh-fi/liquidmesh",
      target: "_blank",
    },
  ];

  return (
    <header className="fixed top-0 z-50 w-full px-4">
      <nav
        className={`mx-auto mt-3 max-w-7xl px-6 transition-all duration-300 ${
          scrolled
            ? "bg-[#080b0f]/85 backdrop-blur-xl rounded-2xl border border-white/8 shadow-xl"
            : ""
        }`}
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
                  target={l.target}
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
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-500 text-black text-sm font-semibold hover:bg-teal-400 transition-colors"
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
              className="block w-full text-center px-5 py-2.5 rounded-lg bg-teal-500 text-black text-sm font-semibold"
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
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <LavaLamp />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-700 text-xs font-semibold mb-8"
        >
          <span className="size-1.5 rounded-full bg-teal-500 animate-pulse" />
          Built on X Layer · OKX OnchainOS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mix-blend-exclusion text-white leading-tight"
        >
          Autonomous <br />
          Trading, Onchain
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 text-base md:text-lg mix-blend-exclusion text-white/90 max-w-2xl mx-auto leading-relaxed"
        >
          Four specialized AI agents — each with its own TEE wallet — that
          scout signals, evaluate risk, execute swaps, and govern the mesh.
          x402 payments at every hop. No human in the loop.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-xl bg-teal-600 text-white text-base font-semibold hover:bg-teal-500 transition-colors shadow-lg shadow-teal-900/20"
          >
            Launch the Mesh
          </Link>
          <a
            href="https://github.com/liquidmesh-fi/liquidmesh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-black/10 text-black/70 text-base font-medium border border-black/15 hover:bg-black/15 transition-colors backdrop-blur-sm"
          >
            <GitBranch className="size-4" />
            View on GitHub
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-black/8 border border-black/12 text-xs font-mono backdrop-blur-sm"
        >
          <span className="text-black/40">Latest tx</span>
          <a
            href="https://www.oklink.com/xlayer/tx/0x6923142bcd0136e53107d16fd7da05ca4b215bc16ff809409f99202523e76570"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 hover:text-teal-600 inline-flex items-center gap-1 transition-colors"
          >
            0x6923…6570
            <ExternalLink className="size-3" />
          </a>
          <span className="text-black/20">·</span>
          <span className="text-black/40">X Layer</span>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

const STATS = [
  { label: "Chain", value: "X Layer (196)" },
  { label: "Agents", value: "4" },
  { label: "Payment Protocol", value: "x402" },
  { label: "Wallet Type", value: "OKX TEE" },
  { label: "Execution", value: "OKX DEX" },
];

export function StatsBar() {
  return (
    <div className="border-y border-white/6 bg-white/2 py-5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center md:justify-between gap-6 md:gap-0">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <p className="text-xs text-white/30 mb-1">{s.label}</p>
              <p className="text-sm font-semibold text-white/80">{s.value}</p>
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
    tagline: "Signal Detection",
    description:
      "Monitors X Layer 24/7 using OKX hot-token and smart money signal APIs. Detects whale moves, trending tokens, and unusual volume. Sells signals behind an x402 paywall.",
    apis: ["hot-token", "dex-signal", "token-trending"],
    color: "teal",
  },
  {
    Icon: BarChart3,
    name: "Analyst",
    tagline: "Risk Scoring",
    description:
      "Pays Scout for signals. Runs OKX security scans, liquidity checks, and holder analysis. Passes structured data to GPT-4o for a 0–100 risk/reward score. Sells scored opportunities.",
    apis: ["dex-security", "token-advanced", "dex-quote"],
    color: "blue",
  },
  {
    Icon: Zap,
    name: "Executor",
    tagline: "Trade Execution",
    description:
      "Pays Analyst for scores ≥ 40. Builds swap calldata via OKX DEX Aggregator. Signs and broadcasts via OKX TEE Agentic Wallet. Returns a real X Layer txHash.",
    apis: ["dex-aggregator", "agentic-wallet", "x402-settle"],
    color: "violet",
  },
  {
    Icon: Network,
    name: "Orchestrator",
    tagline: "Mesh Governance",
    description:
      "Owns the master budget. Monitors all agent wallets. Enforces spend caps. Maintains the public audit trail — earn/spend ratios, txHashes, agent health.",
    apis: ["wallet-portfolio", "wallet-history", "metrics"],
    color: "amber",
  },
];

const colorMap: Record<
  string,
  { card: string; icon: string; dot: string }
> = {
  teal: {
    card: "border-teal-500/20 hover:border-teal-500/35",
    icon: "bg-teal-500/15 text-teal-400",
    dot: "bg-teal-400",
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
            Four Agents. One Mesh.
          </h2>
          <p className="mt-4 text-lg text-white/40 max-w-2xl mx-auto">
            Each agent has one job, one wallet, and one x402 endpoint. Together
            they form an autonomous trading system that runs without human
            intervention.
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
                className={`relative rounded-2xl border bg-white/3 p-7 transition-colors group ${c.card}`}
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
                <div className="flex flex-wrap gap-2">
                  {agent.apis.map((api) => (
                    <span
                      key={api}
                      className="px-2.5 py-1 rounded-md bg-white/5 text-white/40 text-xs font-mono border border-white/8"
                    >
                      {api}
                    </span>
                  ))}
                </div>
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
      "Hot-token API returns a token with high signal strength. Scout persists it to Supabase, emits to EventBus, and makes the data available behind an x402 endpoint.",
    detail: "POST /scout/signal → 402 → X-Payment-Required",
  },
  {
    n: "02",
    Icon: BarChart3,
    title: "Analyst pays and scores",
    description:
      "Analyst calls Scout's endpoint, receives the 402, signs an EIP-3009 USDG transfer via OKX TEE, and replays with X-Payment header. Scout settles on-chain. Analyst scores the signal.",
    detail: "OKX /api/v6/x402/verify → /api/v6/x402/settle",
  },
  {
    n: "03",
    Icon: Zap,
    title: "Executor pays and trades",
    description:
      "Score ≥ 40 → execute. Executor pays Analyst via x402, builds OKB → USDC swap calldata from OKX DEX Aggregator, signs via TEE, and broadcasts. Real txHash returned.",
    detail: "TEE: preTransactionUnsignedInfo → broadcastAgenticTransaction",
  },
  {
    n: "04",
    Icon: Network,
    title: "Orchestrator governs",
    description:
      "Records txHash, updates wallet metrics across all 4 agents, enforces OKB budget. Dashboard shows live feed, agent health, and full trade history.",
    detail: "Supabase: signals + scores + trades + metrics",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-white/1">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white tracking-tight">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-white/40 max-w-xl mx-auto">
            From signal to on-chain settlement in one tick. Every step pays the
            next.
          </p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-5 p-6 rounded-2xl border border-white/8 bg-white/2 hover:border-white/12 transition-colors"
            >
              <div className="shrink-0 size-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <step.Icon className="size-5 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono font-bold text-teal-400/60">
                    {step.n}
                  </span>
                  <h3 className="text-base font-semibold text-white">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-3">
                  {step.description}
                </p>
                <code className="text-xs text-teal-400/70 font-mono bg-teal-500/5 px-3 py-1.5 rounded-lg border border-teal-500/10 block w-fit">
                  {step.detail}
                </code>
              </div>
            </motion.div>
          ))}
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
                  <Check className="size-3.5 text-teal-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/8 bg-white/3 p-6 font-mono text-xs space-y-3"
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
              <span className="text-teal-400">Scout</span>{" "}
              <span className="text-white/30">→</span>{" "}
              <span className="text-white/60">OKX /api/v6/x402/verify</span>
            </div>
            <div>
              <span className="text-teal-400">Scout</span>{" "}
              <span className="text-white/30">→</span>{" "}
              <span className="text-white/60">OKX /api/v6/x402/settle</span>
            </div>
            <div className="pl-4 text-teal-400">← txHash: 0xabc…</div>
            <div className="h-px bg-white/5" />
            <div className="text-teal-400">← 200 OK + signal data</div>
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
    a: "LiquidMesh is a multi-agent system where each agent has its own wallet, operates independently, and pays the next for intelligence. Scout earns from Analyst, Analyst earns from Executor. Every data transfer is a real payment.",
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
              className="rounded-xl border border-white/8 bg-white/2 overflow-hidden"
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
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-transparent to-transparent p-12 text-center overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 size-[400px] rounded-full bg-teal-500/10 blur-[80px]" />
          </div>
          <div className="relative z-10">
            <Activity className="size-8 text-teal-400/60 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
              Watch the mesh run.
            </h2>
            <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
              Four agents. Real wallets. Real swaps. One tick every 30 minutes
              on X Layer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-teal-500 text-black text-base font-semibold hover:bg-teal-400 transition-colors"
              >
                Open Dashboard
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="https://github.com/liquidmesh-fi/liquidmesh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-white/5 text-white/70 text-base font-medium border border-white/10 hover:bg-white/10 transition-colors"
              >
                <GitBranch className="size-4" />
                View Source
              </a>
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
            href="https://x.com/liquidmesh_fi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="size-3.5" />
            Twitter
          </a>
          <a
            href="https://www.oklink.com/xlayer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="size-3.5" />
            OKLink
          </a>
        </div>
      </div>
    </footer>
  );
}
