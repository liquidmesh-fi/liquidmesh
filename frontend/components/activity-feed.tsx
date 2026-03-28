"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useQuery } from "@tanstack/react-query";
import { api, type Trade, type Signal, type Payment, type Score } from "@/lib/api";

type FeedEntry = {
  id: string;
  ts: string;
  prefix: string;
  text: string;
  color: string;
  txHash: string | null;
};

function toEntry(type: "signal" | "score" | "payment" | "trade", data: Signal | Score | Payment | Trade): FeedEntry {
  if (type === "signal") {
    const s = data as Signal;
    return {
      id: `signal-${s.id}`,
      ts: s.created_at,
      prefix: "[SCOUT]",
      text: `${s.token_symbol || s.token_address.slice(0, 8)} detected — strength ${s.signal_strength}`,
      color: "text-blue-400",
      txHash: null,
    };
  }

  if (type === "score") {
    const s = data as Score;
    return {
      id: `score-${s.id}`,
      ts: s.created_at,
      prefix: "[ANALYST]",
      text: `scored ${s.score}/100 → ${s.recommendation.toUpperCase()}`,
      color: s.recommendation === "execute" ? "text-cyan-400" : "text-white/35",
      txHash: null,
    };
  }

  if (type === "payment") {
    const p = data as Payment;
    const from = p.from_agent.startsWith("0x")
      ? `${p.from_agent.slice(0, 6)}…`
      : p.from_agent;
    return {
      id: `payment-${p.id}`,
      ts: p.created_at,
      prefix: "[x402]",
      text: `${from} → ${p.to_endpoint}: ${(Number(p.amount_usdg) / 1e6).toFixed(3)} USDG`,
      color: "text-purple-400",
      txHash: p.tx_hash || null,
    };
  }

  const t = data as Trade;
  const statusText =
    t.status === "success"
      ? `swapped ${t.amount_okb} OKB → USDG`
      : t.status === "failed"
        ? `swap failed — ${t.error?.slice(0, 40) ?? "unknown error"}`
        : `pending ${t.amount_okb} OKB swap`;

  return {
    id: `trade-${t.id}`,
    ts: t.created_at,
    prefix: "[EXEC]",
    text: statusText,
    color:
      t.status === "success"
        ? "text-cyan-400"
        : t.status === "failed"
          ? "text-red-400"
          : "text-amber-400",
    txHash: t.tx_hash || null,
  };
}

function buildEntries(
  trades: Trade[],
  signals: Signal[],
  payments: Payment[],
  scores: Score[],
): FeedEntry[] {
  const all: FeedEntry[] = [
    ...signals.slice(0, 8).map((d) => toEntry("signal", d)),
    ...scores.slice(0, 8).map((d) => toEntry("score", d)),
    ...payments.slice(0, 8).map((d) => toEntry("payment", d)),
    ...trades.slice(0, 10).map((d) => toEntry("trade", d)),
  ];
  return all
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 30);
}

export function ActivityFeed() {
  const trades = useQuery({ queryKey: ["trades"], queryFn: api.getTrades, refetchInterval: 5000 });
  const signals = useQuery({ queryKey: ["signals"], queryFn: api.getSignals, refetchInterval: 5000 });
  const payments = useQuery({ queryKey: ["payments"], queryFn: api.getPayments, refetchInterval: 5000 });
  const scores = useQuery({ queryKey: ["scores"], queryFn: api.getScores, refetchInterval: 5000 });

  const entries = buildEntries(
    trades.data?.data ?? [],
    signals.data?.data ?? [],
    payments.data?.data ?? [],
    scores.data?.data ?? [],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const entryIdKey = entries.map((e) => e.id).join(",");

  useEffect(() => {
    if (entries.length === 0) return;
    const currentIds = new Set(entries.map((e) => e.id));

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      knownIdsRef.current = currentIds;
      return;
    }

    const fresh = new Set([...currentIds].filter((id) => !knownIdsRef.current.has(id)));
    knownIdsRef.current = currentIds;

    if (fresh.size > 0) {
      setNewIds(fresh);
      setTimeout(() => setNewIds(new Set()), 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryIdKey]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entryIdKey]);

  return (
    <div className="rounded-xl border border-white/8 bg-[#06080c] flex flex-col h-full">
      <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-mono font-semibold tracking-[0.2em] text-white/40 uppercase">
          Mesh Log
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono text-white/25 tracking-wider">LIVE</span>
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 font-mono text-[11px] leading-relaxed"
      >
        {entries.length === 0 ? (
          <p className="text-white/20 italic p-4 text-center">
            Awaiting mesh activity<span className="animate-pulse">_</span>
          </p>
        ) : (
          entries.map((entry, i) => (
            <LogLine
              key={entry.id}
              entry={entry}
              lineNum={entries.length - i}
              isNew={newIds.has(entry.id)}
              dimmed={i >= 6}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LogLine({
  entry,
  lineNum,
  isNew,
  dimmed,
}: {
  entry: FeedEntry;
  lineNum: number;
  isNew: boolean;
  dimmed: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNew || !ref.current) return;
    const textEl = ref.current.querySelector("[data-chars]") as HTMLSpanElement | null;
    if (!textEl) return;

    const fullText = textEl.textContent ?? "";
    textEl.textContent = "";

    const charEls: HTMLSpanElement[] = [];
    for (const char of fullText.split("")) {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.opacity = "0";
      charEls.push(span);
      textEl.appendChild(span);
    }

    gsap.to(charEls, { opacity: 1, duration: 0.015, stagger: 0.012, ease: "none" });
  }, [isNew]);

  const time = new Date(entry.ts).toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div
      ref={ref}
      className={`flex items-start gap-2 py-[3px] transition-opacity duration-500 ${dimmed ? "opacity-35" : "opacity-100"}`}
    >
      <span className="text-white/15 select-none shrink-0 tabular-nums w-7 text-right">
        {String(lineNum).padStart(3, "0")}
      </span>

      <span className={`shrink-0 font-bold ${entry.color}`}>{entry.prefix}</span>

      <span className="flex-1 min-w-0 text-white/65 truncate">
        {entry.txHash ? (
          <a
            href={`https://www.oklink.com/xlayer/tx/${entry.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            <span data-chars>{entry.text}</span>
            <span className="text-cyan-400/50 ml-1">↗</span>
          </a>
        ) : (
          <span data-chars>{entry.text}</span>
        )}
      </span>

      <time className="text-white/15 shrink-0 tabular-nums text-[10px] leading-none mt-0.5">
        {time}
      </time>
    </div>
  );
}
