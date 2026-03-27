"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type Trade, type Signal, type Payment } from "../../lib/api";

type FeedItem =
  | { type: "trade"; ts: string; data: Trade }
  | { type: "signal"; ts: string; data: Signal }
  | { type: "payment"; ts: string; data: Payment };

function buildFeed(
  trades: Trade[],
  signals: Signal[],
  payments: Payment[],
): FeedItem[] {
  const items: FeedItem[] = [
    ...trades.slice(0, 8).map((d): FeedItem => ({ type: "trade", ts: d.created_at, data: d })),
    ...signals.slice(0, 5).map((d): FeedItem => ({ type: "signal", ts: d.created_at, data: d })),
    ...payments.slice(0, 5).map((d): FeedItem => ({ type: "payment", ts: d.created_at, data: d })),
  ];
  return items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 15);
}

export function ActivityFeed() {
  const trades = useQuery({ queryKey: ["trades"], queryFn: () => api.getTrades() });
  const signals = useQuery({ queryKey: ["signals"], queryFn: () => api.getSignals() });
  const payments = useQuery({ queryKey: ["payments"], queryFn: () => api.getPayments() });

  const feed = buildFeed(
    trades.data?.data ?? [],
    signals.data?.data ?? [],
    payments.data?.data ?? [],
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
  const { icon, label, detail, color } = formatItem(item);

  return (
    <div className="flex items-start gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
      <span className={`text-base leading-none mt-0.5 ${color}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/70 truncate">{label}</p>
        <p className="text-xs text-white/30 mt-0.5 truncate font-mono">{detail}</p>
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
} {
  if (item.type === "trade") {
    const { status, token_symbol, amount_okb, tx_hash } = item.data;
    return {
      icon: status === "success" ? "↑" : status === "failed" ? "✕" : "⋯",
      label: `${status === "success" ? "Swapped" : status === "failed" ? "Failed swap" : "Pending"} ${amount_okb} OKB → USDG`,
      detail: tx_hash ? tx_hash.slice(0, 24) + "…" : token_symbol,
      color:
        status === "success"
          ? "text-emerald-400"
          : status === "failed"
            ? "text-red-400"
            : "text-yellow-400",
    };
  }

  if (item.type === "signal") {
    return {
      icon: "◈",
      label: `Signal: ${item.data.token_symbol} (strength: ${item.data.signal_strength})`,
      detail: item.data.token_address.slice(0, 24) + "…",
      color: "text-blue-400",
    };
  }

  return {
    icon: "⬡",
    label: `x402 payment to ${item.data.to_endpoint}`,
    detail: `${(Number(item.data.amount_usdg) / 1e6).toFixed(3)} USDG from ${item.data.from_agent.slice(0, 8)}…`,
    color: "text-purple-400",
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
