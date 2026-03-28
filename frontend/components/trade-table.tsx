"use client";

import React, { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, type Trade, type Score } from "@/lib/api";

export function TradeTable() {
  const { data: tradesRes, isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: api.getTrades,
    refetchInterval: 5000,
  });

  const { data: scoresRes } = useQuery({
    queryKey: ["scores"],
    queryFn: api.getScores,
    refetchInterval: 5000,
  });

  const trades = tradesRes?.data ?? [];
  const scores = scoresRes?.data ?? [];

  const scoreById = new Map(scores.map((s) => [s.id, s]));

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 flex flex-col h-full">
      <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-white">Trade History</h2>
        <span className="text-xs text-white/25 font-mono">{trades.length} trades</span>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              <Th>Time</Th>
              <Th>Token</Th>
              <Th>Amount</Th>
              <Th>Score</Th>
              <Th>Status</Th>
              <Th>Tx</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-white/25 text-xs">
                  Loading…
                </td>
              </tr>
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-white/25 text-xs">
                  No trades yet — run a tick to start
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <TradeRow
                  key={trade.id}
                  trade={trade}
                  score={trade.score_id ? scoreById.get(trade.score_id) : undefined}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TradeRow({ trade, score }: { trade: Trade; score?: Score }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        onClick={() => setOpen((o) => !o)}
        className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors cursor-pointer"
      >
        <Td mono>{formatTime(trade.created_at)}</Td>
        <Td mono>
          <span className="text-white/80">
            {trade.token_symbol || `${trade.token_address.slice(0, 6)}…`}
          </span>
        </Td>
        <Td mono>{trade.amount_okb} OKB</Td>
        <Td>
          {score ? (
            <span
              className={`font-mono ${
                score.score >= 70
                  ? "text-cyan-400"
                  : score.score >= 50
                    ? "text-amber-400"
                    : "text-red-400/70"
              }`}
            >
              {score.score}
              <span className="text-white/20">/100</span>
            </span>
          ) : (
            <span className="text-white/20">—</span>
          )}
        </Td>
        <Td>
          <StatusBadge status={trade.status} />
        </Td>
        <Td mono>
          {trade.tx_hash ? (
            <a
              href={`https://www.oklink.com/xlayer/tx/${trade.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400/60 hover:text-cyan-400 transition-colors flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {trade.tx_hash.slice(0, 10)}…
              <ExternalLink className="size-2.5" />
            </a>
          ) : (
            <span className="text-white/20">—</span>
          )}
        </Td>
        <Td>
          <ChevronRight
            className={`size-3 text-white/20 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          />
        </Td>
      </tr>

      {open && (
        <tr className="border-b border-white/5">
          <td colSpan={7} className="px-5 py-4 bg-white/[0.015]">
            <div className="space-y-3">
              {score && (
                <>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
                      Analyst Reason
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed">{score.reason}</p>
                  </div>

                  {score.risk_factors.length > 0 && (
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">
                        Risk Factors
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {score.risk_factors.map((rf) => (
                          <span
                            key={rf}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/8 text-red-400/60 border border-red-500/15"
                          >
                            {rf}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {trade.error && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Error</p>
                  <p className="text-xs text-red-400/70 font-mono">{trade.error}</p>
                </div>
              )}

              {trade.tx_hash && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
                    Transaction
                  </p>
                  <a
                    href={`https://www.oklink.com/xlayer/tx/${trade.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-cyan-400/60 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                  >
                    {trade.tx_hash}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: Trade["status"] }) {
  const styles: Record<Trade["status"], string> = {
    success: "bg-cyan-400/10 text-cyan-400 border border-cyan-400/15",
    failed: "bg-red-400/10 text-red-400 border border-red-400/15",
    pending: "bg-amber-400/10 text-amber-400 border border-amber-400/15",
  };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono ${styles[status]}`}>
      {status}
    </span>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-5 py-2.5 text-left text-[10px] text-white/25 font-medium uppercase tracking-widest">
      {children}
    </th>
  );
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={`px-5 py-3 text-white/50 ${mono ? "font-mono" : ""}`}>{children}</td>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
