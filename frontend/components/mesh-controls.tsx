"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type TradeSummary } from "@/lib/api";

export function MeshControls() {
  const queryClient = useQueryClient();

  const { data: summaryRes } = useQuery({
    queryKey: ["summary"],
    queryFn: () => api.getMeshSummary(),
    refetchInterval: 5000,
  });

  const summary = summaryRes?.data;
  const mesh = summary?.mesh;
  const isRunning = mesh?.isRunning ?? false;

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
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
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
        {mesh?.startedAt && isRunning && (
          <span className="text-xs text-white/30">
            since {new Date(mesh.startedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {summary && (
        <div className="flex items-center gap-6 text-sm">
          <Metric label="Trades" value={summary.total} />
          <Metric
            label="Success"
            value={
              summary.total > 0
                ? `${Math.round((summary.success / summary.total) * 100)}%`
                : "—"
            }
          />
          <Metric
            label="OKB spent"
            value={`${summary.totalOkbSpent.toFixed(4)}`}
          />
        </div>
      )}

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
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xs text-white/30">{label}</p>
      <p className="font-mono text-white/70">{value}</p>
    </div>
  );
}
