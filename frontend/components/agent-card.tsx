"use client";

import { Radar, BarChart3, Zap, Network } from "lucide-react";
import type { AgentStatus, AgentBalance } from "@/lib/api";

const AGENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Scout: Radar,
  Analyst: BarChart3,
  Executor: Zap,
  Orchestrator: Network,
};

const AGENT_ROLES: Record<string, string> = {
  Scout: "Signal Detection",
  Analyst: "Risk Scoring",
  Executor: "Swap Execution",
  Orchestrator: "Mesh Coordination",
};

const AGENT_COLORS: Record<string, { icon: string; border: string; dot: string; dotShadow: string; text: string }> = {
  Scout:        { icon: "bg-cyan-500/15 border-cyan-500/25 text-cyan-400",       border: "hover:border-cyan-500/30",   dot: "bg-cyan-400",   dotShadow: "shadow-[0_0_6px_rgba(34,211,238,0.6)]",   text: "text-cyan-400" },
  Analyst:      { icon: "bg-blue-500/15 border-blue-500/25 text-blue-400",       border: "hover:border-blue-500/30",   dot: "bg-blue-400",   dotShadow: "shadow-[0_0_6px_rgba(96,165,250,0.6)]",   text: "text-blue-400" },
  Executor:     { icon: "bg-violet-500/15 border-violet-500/25 text-violet-400", border: "hover:border-violet-500/30", dot: "bg-violet-400", dotShadow: "shadow-[0_0_6px_rgba(167,139,250,0.6)]",   text: "text-violet-400" },
  Orchestrator: { icon: "bg-amber-500/15 border-amber-500/25 text-amber-400",    border: "hover:border-amber-500/30",  dot: "bg-amber-400",  dotShadow: "shadow-[0_0_6px_rgba(251,191,36,0.6)]",   text: "text-amber-400" },
};

const DEFAULT_COLOR = AGENT_COLORS.Scout;

interface AgentCardProps {
  agent: AgentStatus;
  balance?: AgentBalance;
}

export function AgentCard({ agent, balance }: AgentCardProps) {
  const Icon = AGENT_ICONS[agent.name] ?? Radar;
  const role = AGENT_ROLES[agent.name] ?? agent.name;
  const colors = AGENT_COLORS[agent.name] ?? DEFAULT_COLOR;
  const shortAddress = agent.walletAddress
    ? `${agent.walletAddress.slice(0, 6)}…${agent.walletAddress.slice(-4)}`
    : "—";

  const okb = balance ? parseFloat(balance.okb) : null;
  const usdg = balance ? parseFloat(balance.usdg) : null;
  const usdc = balance ? parseFloat(balance.usdc) : null;
  const totalUsd = balance ? parseFloat(balance.totalUsdValue) : null;

  return (
    <div className={`relative rounded-xl border border-white/8 bg-white/3 p-5 flex flex-col gap-4 transition-colors ${colors.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`size-9 rounded-lg border flex items-center justify-center ${colors.icon}`}>
            <Icon className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{agent.name}</p>
            <p className="text-xs text-white/40 mt-0.5">{role}</p>
          </div>
        </div>
        <StatusDot active={agent.isRunning} dotClass={colors.dot} shadowClass={colors.dotShadow} textClass={colors.text} />
      </div>

      {/* Wallet balances */}
      <div className="grid grid-cols-2 gap-2">
        <BalanceStat
          label="OKB"
          value={okb !== null ? formatBalance(okb, 4) : "—"}
          sub={balance?.okbUsd ? `$${parseFloat(balance.okbUsd).toFixed(2)}` : undefined}
          loading={!balance}
        />
        <BalanceStat
          label="USDG"
          value={usdg !== null ? formatBalance(usdg, 4) : "—"}
          sub={usdc !== null && usdc > 0 ? `+${formatBalance(usdc, 2)} USDC` : undefined}
          loading={!balance}
        />
      </div>

      {/* Footer: total USD + address + cycles */}
      <div className="pt-1 border-t border-white/5 flex items-center justify-between">
        {agent.walletAddress ? (
          <a
            href={`https://www.oklink.com/xlayer/address/${agent.walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/30 font-mono hover:text-white/60 transition-colors"
            title={agent.walletAddress}
          >
            {shortAddress}
          </a>
        ) : (
          <p className="text-xs text-white/30 font-mono">—</p>
        )}
        <div className="flex items-center gap-3">
          {totalUsd !== null && totalUsd > 0 && (
            <span className={`text-xs font-mono ${colors.text}`}>${totalUsd.toFixed(2)}</span>
          )}
          <span className="text-xs text-white/25">{agent.cycleCount} cycles</span>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ active, dotClass, shadowClass, textClass }: { active: boolean; dotClass: string; shadowClass: string; textClass: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${active ? `${dotClass} ${shadowClass}` : "bg-white/20"}`} />
      <span className={`text-xs ${active ? textClass : "text-white/30"}`}>
        {active ? "Running" : "Idle"}
      </span>
    </div>
  );
}

function BalanceStat({ label, value, sub, loading }: { label: string; value: string; sub?: string; loading?: boolean }) {
  return (
    <div className="bg-white/3 rounded-lg px-3 py-2">
      <p className="text-xs text-white/30 mb-0.5">{label}</p>
      {loading ? (
        <div className="h-4 w-12 rounded bg-white/8 animate-pulse" />
      ) : (
        <p className="text-sm font-mono text-white/80">{value}</p>
      )}
      {sub && <p className="text-xs text-white/25 mt-0.5">{sub}</p>}
    </div>
  );
}

function formatBalance(n: number, decimals: number): string {
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return n.toFixed(decimals);
}
