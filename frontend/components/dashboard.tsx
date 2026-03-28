"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { AgentCard } from "./agent-card";
import { ActivityFeed } from "./activity-feed";
import { TradeTable } from "./trade-table";
import { MeshControls } from "./mesh-controls";
import { WalletButton } from "./wallet-button";
import { api } from "@/lib/api";

export function Dashboard() {
  const { data: summaryRes } = useQuery({
    queryKey: ["summary"],
    queryFn: () => api.getMeshSummary(),
    refetchInterval: 5000,
  });

  const agents = summaryRes?.data?.mesh?.agents ?? [];

  return (
    <div className="min-h-screen bg-[#080b0f] text-white">
      {/* Header */}
      <header className="border-b border-white/6 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/icon.png"
              alt="LiquidMesh"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-base font-semibold tracking-tight">LiquidMesh</h1>
              <p className="text-xs text-white/40">X Layer · OKX OnchainOS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-white/30">
              <span className="size-1.5 rounded-full bg-teal-400/60" />
              Chain 196
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Mesh controls + summary */}
        <section className="rounded-xl border border-white/8 bg-white/3 px-6 py-5">
          <MeshControls />
        </section>

        {/* Agent grid */}
        <section>
          <h2 className="text-xs font-medium text-white/30 uppercase tracking-widest mb-4">
            Agents
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.length > 0
              ? agents.map((agent) => (
                  <AgentCard key={agent.name} agent={agent} />
                ))
              : PLACEHOLDER_AGENTS.map((name) => (
                  <PlaceholderCard key={name} name={name} />
                ))}
          </div>
        </section>

        {/* Activity + Trades */}
        <section className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <ActivityFeed />
          </div>
          <div className="lg:col-span-3">
            <TradeTable />
          </div>
        </section>
      </main>
    </div>
  );
}

const PLACEHOLDER_AGENTS = ["Scout", "Analyst", "Executor", "Orchestrator"];

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

function PlaceholderCard({ name }: { name: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-5 flex flex-col gap-4 opacity-50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none text-white/30">{AGENT_ICONS[name]}</span>
          <div>
            <p className="text-sm font-semibold text-white/50">{name}</p>
            <p className="text-xs text-white/25 mt-0.5">{AGENT_ROLES[name]}</p>
          </div>
        </div>
        <span className="size-2 rounded-full bg-white/15" />
      </div>
      <div className="h-4 rounded bg-white/5 w-2/3" />
      <div className="pt-1 border-t border-white/5">
        <div className="h-3 rounded bg-white/5 w-3/4" />
      </div>
    </div>
  );
}
