"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type Trade } from "../../lib/api";

export function TradeTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: () => api.getTrades(),
  });

  const trades = data?.data ?? [];

  return (
    <div className="rounded-xl border border-white/8 bg-white/3">
      <div className="px-5 py-4 border-b border-white/8">
        <h2 className="text-sm font-semibold text-white">Trade History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              <Th>Time</Th>
              <Th>Token</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Tx Hash</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-white/30">
                  Loading…
                </td>
              </tr>
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-white/30">
                  No trades yet
                </td>
              </tr>
            ) : (
              trades.map((trade) => <TradeRow key={trade.id} trade={trade} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  return (
    <tr className="hover:bg-white/2 transition-colors">
      <Td mono>{formatTime(trade.created_at)}</Td>
      <Td mono>{trade.token_symbol || trade.token_address.slice(0, 8) + "…"}</Td>
      <Td mono>{trade.amount_okb} OKB</Td>
      <Td>
        <StatusBadge status={trade.status} />
      </Td>
      <Td mono>
        {trade.tx_hash ? (
          <span className="text-white/50">{trade.tx_hash.slice(0, 16)}…</span>
        ) : (
          <span className="text-white/20">—</span>
        )}
      </Td>
    </tr>
  );
}

function StatusBadge({ status }: { status: Trade["status"] }) {
  const styles = {
    success: "bg-emerald-400/10 text-emerald-400",
    failed: "bg-red-400/10 text-red-400",
    pending: "bg-yellow-400/10 text-yellow-400",
  };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${styles[status]}`}>
      {status}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-2.5 text-left text-white/30 font-medium">
      {children}
    </th>
  );
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={`px-5 py-3 text-white/60 ${mono ? "font-mono" : ""}`}>
      {children}
    </td>
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
