import { createClient } from "@supabase/supabase-js";
import { env } from "../env";

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

// --- Types ---

export interface Signal {
  id?: string;
  created_at?: string;
  token_address: string;
  token_symbol: string;
  chain_index: string;
  signal_strength: number;
  raw_data: Record<string, unknown>;
}

export interface Score {
  id?: string;
  created_at?: string;
  signal_id: string;
  token_address: string;
  score: number;
  recommendation: "execute" | "skip";
  reason: string;
  risk_factors: string[];
}

export interface Trade {
  id?: string;
  created_at?: string;
  score_id: string;
  token_address: string;
  token_symbol: string;
  amount_okb: string;
  tx_hash: string | null;
  status: "pending" | "success" | "failed";
  error: string | null;
}

export interface Payment {
  id?: string;
  created_at?: string;
  from_agent: string;
  to_endpoint: string;
  amount_usdg: string;
  tx_hash: string;
  purpose: "signal" | "score";
}

export interface Metric {
  id?: string;
  created_at?: string;
  agent_name: string;
  metric_type: string;
  value: number;
  metadata: Record<string, unknown>;
}

// --- Queries ---

export async function insertSignal(signal: Signal) {
  const { data, error } = await supabase
    .from("signals")
    .insert(signal)
    .select()
    .single();
  if (error) throw new Error(`insertSignal: ${error.message}`);
  return data as Signal;
}

export async function insertScore(score: Score) {
  const { data, error } = await supabase
    .from("scores")
    .insert(score)
    .select()
    .single();
  if (error) throw new Error(`insertScore: ${error.message}`);
  return data as Score;
}

export async function insertTrade(trade: Trade) {
  const { data, error } = await supabase
    .from("trades")
    .insert(trade)
    .select()
    .single();
  if (error) throw new Error(`insertTrade: ${error.message}`);
  return data as Trade;
}

export async function updateTrade(
  id: string,
  patch: Partial<Trade>,
): Promise<Trade> {
  const { data, error } = await supabase
    .from("trades")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`updateTrade: ${error.message}`);
  return data as Trade;
}

export async function insertPayment(payment: Payment) {
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select()
    .single();
  if (error) throw new Error(`insertPayment: ${error.message}`);
  return data as Payment;
}

export async function insertMetric(metric: Metric) {
  const { error } = await supabase.from("metrics").insert(metric);
  if (error) throw new Error(`insertMetric: ${error.message}`);
}

export async function getRecentTrades(limit = 20): Promise<Trade[]> {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRecentTrades: ${error.message}`);
  return (data ?? []) as Trade[];
}

export async function getRecentSignals(limit = 10): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRecentSignals: ${error.message}`);
  return (data ?? []) as Signal[];
}

export async function getRecentScores(limit = 10): Promise<Score[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRecentScores: ${error.message}`);
  return (data ?? []) as Score[];
}

export async function getRecentPayments(limit = 20): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRecentPayments: ${error.message}`);
  return (data ?? []) as Payment[];
}

export async function getTradeSummary(): Promise<{
  total: number;
  success: number;
  failed: number;
  totalOkbSpent: number;
}> {
  const { data, error } = await supabase
    .from("trades")
    .select("status, amount_okb");
  if (error) throw new Error(`getTradeSummary: ${error.message}`);

  const trades = (data ?? []) as Pick<Trade, "status" | "amount_okb">[];
  return {
    total: trades.length,
    success: trades.filter((t) => t.status === "success").length,
    failed: trades.filter((t) => t.status === "failed").length,
    totalOkbSpent: trades
      .filter((t) => t.status === "success")
      .reduce((sum, t) => sum + Number.parseFloat(t.amount_okb), 0),
  };
}

export async function getTotalUsdgEarned(): Promise<number> {
  const { data, error } = await supabase
    .from("payments")
    .select("amount_usdg");
  if (error) throw new Error(`getTotalUsdgEarned: ${error.message}`);

  const payments = (data ?? []) as Pick<Payment, "amount_usdg">[];
  return payments.reduce((sum, p) => sum + Number.parseFloat(p.amount_usdg), 0);
}

export async function getLastTickAt(): Promise<string | null> {
  const { data, error } = await supabase
    .from("signals")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getLastTickAt: ${error.message}`);
  return (data as { created_at: string } | null)?.created_at ?? null;
}

export async function getCompoundHistory(limit = 5): Promise<Metric[]> {
  const { data, error } = await supabase
    .from("metrics")
    .select("*")
    .eq("metric_type", "compound")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getCompoundHistory: ${error.message}`);
  return (data ?? []) as Metric[];
}
