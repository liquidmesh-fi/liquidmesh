"use client";

import type { AgentStatus } from "../../lib/api";

const AGENT_ICONS: Record<string, string> = {
  Scout: "⬡",
  Analyst: "◈",
  Executor: "⚡",
  Orchestrator: "◎",
};

const AGENT_ROLES: Record<string, string> = {
  Scout: "Signal Detection",
  Analyst: "Risk Scoring",
  Executor: "Swap Execution",
  Orchestrator: "Mesh Coordination",
};

interface AgentCardProps {
  agent: AgentStatus;
}

export function AgentCard({ agent }: AgentCardProps) {
  const icon = AGENT_ICONS[agent.name] ?? "◯";
  const role = AGENT_ROLES[agent.name] ?? agent.name;
  const shortAddress = agent.walletAddress
    ? `${agent.walletAddress.slice(0, 6)}…${agent.walletAddress.slice(-4)}`
    : "—";

  return (
    <div className="relative rounded-xl border border-white/8 bg-white/3 p-5 flex flex-col gap-4 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none text-emerald-400">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{agent.name}</p>
            <p className="text-xs text-white/40 mt-0.5">{role}</p>
          </div>
        </div>
        <StatusDot active={agent.isRunning} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Cycles" value={agent.cycleCount.toString()} />
        <Stat
          label="Last Active"
          value={
            agent.lastActivity
              ? timeAgo(agent.lastActivity)
              : "Never"
          }
        />
      </div>

      <div className="pt-1 border-t border-white/5">
        <p className="text-xs text-white/30 font-mono">{shortAddress}</p>
      </div>
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`size-2 rounded-full ${
          active ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-white/20"
        }`}
      />
      <span className={`text-xs ${active ? "text-emerald-400" : "text-white/30"}`}>
        {active ? "Running" : "Idle"}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/30 mb-0.5">{label}</p>
      <p className="text-sm font-mono text-white/80">{value}</p>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
