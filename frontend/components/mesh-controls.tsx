"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type TradeSummary } from "@/lib/api";

function useCycleCountdown(nextCycleAt: string | null) {
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!nextCycleAt) {
      setSecondsLeft(null);
      return;
    }

    function compute() {
      const diff = Math.floor((new Date(nextCycleAt!).getTime() - Date.now()) / 1000);
      setSecondsLeft(diff > 0 ? diff : 0);
    }

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [nextCycleAt]);

  if (secondsLeft === null) return null;
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function MeshControls() {
  const queryClient = useQueryClient();

  const { data: summaryRes } = useQuery({
    queryKey: ["summary"],
    queryFn: () => api.getMeshSummary(),
    refetchInterval: 5000,
  });

  const { data: economyRes } = useQuery({
    queryKey: ["economy"],
    queryFn: () => api.getEconomy(),
    refetchInterval: 10000,
  });

  const summary = summaryRes?.data;
  const economy = economyRes?.data;
  const mesh = summary?.mesh;
  const isRunning = mesh?.isRunning ?? false;

  const countdown = useCycleCountdown(summary?.nextCycleAt ?? null);

  const startMutation = useMutation({
    mutationFn: api.startMesh,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary"] }),
  });

  const stopMutation = useMutation({
    mutationFn: api.stopMesh,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary"] }),
  });

  const tickMutation = useMutation({
    mutationFn: api.runTick,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["economy"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  const earnSpendRatio = economy?.earnSpendRatio ?? 0;
  const totalUsdgEarned = economy?.totalUsdgEarned ?? summary?.totalUsdgEarned ?? 0;

  return (
    <div className="space-y-4">
      {/* Top row: status + countdown + controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`size-2.5 rounded-full ${
                isRunning
                  ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)] animate-pulse"
                  : "bg-white/20"
              }`}
            />
            <span className="text-sm text-white/60">
              {isRunning ? "Mesh active" : "Mesh idle"}
            </span>
          </div>

          {countdown !== null ? (
            <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono">
              <span className="text-white/20">next cycle in</span>
              <span className="text-cyan-400/70">{countdown}</span>
              <span className="text-white/20">· every 30min</span>
            </div>
          ) : (
            <span className="text-xs text-white/25 font-mono">runs every 30min</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => tickMutation.mutate()}
            disabled={tickMutation.isPending}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-400 text-black hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {tickMutation.isPending ? "Running…" : "▶ Run Tick"}
          </button>
          <button
            onClick={() => startMutation.mutate()}
            disabled={isRunning || startMutation.isPending}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {startMutation.isPending ? "Starting…" : "Auto Mode"}
          </button>
          <button
            onClick={() => stopMutation.mutate()}
            disabled={!isRunning || stopMutation.isPending}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {stopMutation.isPending ? "Stopping…" : "Stop"}
          </button>
        </div>
      </div>

      {/* Economy metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/6">
        <EconMetric
          label="Trades"
          value={summary?.total ?? 0}
          sub={summary && summary.total > 0 ? `${Math.round((summary.success / summary.total) * 100)}% success` : undefined}
        />
        <EconMetric
          label="OKB Spent"
          value={`${(summary?.totalOkbSpent ?? 0).toFixed(4)}`}
          sub="trading capital"
        />
        <EconMetric
          label="USDG Earned"
          value={`${totalUsdgEarned.toFixed(4)}`}
          sub="via x402 settlements"
          highlight={totalUsdgEarned > 0}
        />
        <EconMetric
          label="Earn/Spend"
          value={earnSpendRatio > 0 ? earnSpendRatio.toFixed(3) : "—"}
          sub={earnSpendRatio >= 1 ? "✓ profitable" : earnSpendRatio > 0 ? "building" : "awaiting data"}
          highlight={earnSpendRatio >= 1}
        />
      </div>
    </div>
  );
}

function EconMetric({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-white/30">{label}</p>
      <p className={`font-mono text-sm font-medium ${highlight ? "text-cyan-400" : "text-white/70"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/25">{sub}</p>}
    </div>
  );
}
