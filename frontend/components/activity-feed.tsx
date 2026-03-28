"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type Trade, type Signal, type Payment, type Score } from "@/lib/api";

type FeedItem =
  | { type: "trade"; ts: string; data: Trade }
  | { type: "signal"; ts: string; data: Signal }
  | { type: "payment"; ts: string; data: Payment }
  | { type: "score"; ts: string; data: Score };

function buildFeed(
  trades: Trade[],
  signals: Signal[],
  payments: Payment[],
  scores: Score[],
): FeedItem[] {
  const items: FeedItem[] = [
    ...trades.slice(0, 8).map((d): FeedItem => ({ type: "trade", ts: d.created_at, data: d })),
    ...signals.slice(0, 5).map((d): FeedItem => ({ type: "signal", ts: d.created_at, data: d })),
    ...payments.slice(0, 5).map((d): FeedItem => ({ type: "payment", ts: d.created_at, data: d })),
    ...scores.slice(0, 5).map((d): FeedItem => ({ type: "score", ts: d.created_at, data: d })),
  ];
  return items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 20);
}

export function ActivityFeed() {
  const trades = useQuery({ queryKey: ["trades"], queryFn: () => api.getTrades(), refetchInterval: 5000 });
  const signals = useQuery({ queryKey: ["signals"], queryFn: () => api.getSignals(), refetchInterval: 5000 });
  const payments = useQuery({ queryKey: ["payments"], queryFn: () => api.getPayments(), refetchInterval: 5000 });
  const scores = useQuery({ queryKey: ["scores"], queryFn: () => api.getScores(), refetchInterval: 5000 });

  const feed = buildFeed(
    trades.data?.data ?? [],
    signals.data?.data ?? [],
    payments.data?.data ?? [],
    scores.data?.data ?? [],
  );

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 flex flex-col h-full">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Live Activity</h2>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/40">Live</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {feed.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">
            Waiting for activity…
          </div>
        ) : (
          feed.map((item, i) => <FeedRow key={`${item.type}-${i}`} item={item} />)
        )}
      </div>
    </div>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const { icon, label, detail, color, txHash } = formatItem(item);

  return (
    <div className="flex items-start gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
      <span className={`text-base leading-none mt-0.5 ${color}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/70 truncate">{label}</p>
        {txHash ? (
          <a
            href={`https://www.oklink.com/xlayer/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400/60 hover:text-emerald-400 mt-0.5 truncate font-mono transition-colors block"
          >
            {detail} ↗
          </a>
        ) : (
          <p className="text-xs text-white/30 mt-0.5 truncate font-mono">{detail}</p>
        )}
      </div>
      <time className="text-xs text-white/25 shrink-0 tabular-nums">
        {formatTime(item.ts)}
      </time>
    </div>
  );
}

function formatItem(item: FeedItem): {
  icon: string;
  label: string;
  detail: string;
  color: string;
  txHash: string | null;
} {
  if (item.type === "trade") {
    const { status, token_symbol, amount_okb, tx_hash } = item.data;
    return {
      icon: status === "success" ? "↑" : status === "failed" ? "✕" : "⋯",
      label: `${status === "success" ? "Swapped" : status === "failed" ? "Failed swap" : "Pending"} ${amount_okb} OKB → USDG`,
      detail: tx_hash ? tx_hash.slice(0, 20) + "…" : token_symbol,
      color:
        status === "success"
          ? "text-emerald-400"
          : status === "failed"
            ? "text-red-400"
            : "text-yellow-400",
      txHash: tx_hash ?? null,
    };
  }

  if (item.type === "signal") {
    return {
      icon: "◈",
      label: `Scout: ${item.data.token_symbol} signal (strength: ${item.data.signal_strength})`,
      detail: item.data.token_address.slice(0, 20) + "…",
      color: "text-blue-400",
      txHash: null,
    };
  }

  if (item.type === "score") {
    const action = item.data.recommendation === "execute" ? "execute" : "skip";
    return {
      icon: item.data.recommendation === "execute" ? "✓" : "✗",
      label: `Analyst: score ${item.data.score}/100 → ${action}`,
      detail: item.data.reason,
      color: item.data.recommendation === "execute" ? "text-emerald-400" : "text-white/40",
      txHash: null,
    };
  }

  const agentLabel = item.data.from_agent.startsWith("0x")
    ? item.data.from_agent.slice(0, 8) + "…"
    : item.data.from_agent;
  return {
    icon: "⬡",
    label: `x402: ${agentLabel} → ${item.data.to_endpoint} · ${(Number(item.data.amount_usdg) / 1e6).toFixed(3)} USDG`,
    detail: item.data.tx_hash.slice(0, 20) + "…",
    color: "text-purple-400",
    txHash: item.data.tx_hash || null,
  };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
