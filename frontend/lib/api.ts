const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export interface AgentStatus {
  name: string;
  isRunning: boolean;
  cycleCount: number;
  lastActivity: string | null;
  nextCheckIn: number | null;
  walletAddress: string;
}

export interface MeshStatus {
  isRunning: boolean;
  agents: AgentStatus[];
  startedAt: string | null;
}

export interface Trade {
  id: string;
  created_at: string;
  token_address: string;
  token_symbol: string;
  amount_okb: string;
  tx_hash: string | null;
  status: "pending" | "success" | "failed";
  error: string | null;
  score_id: string;
}

export interface Signal {
  id: string;
  created_at: string;
  token_address: string;
  token_symbol: string;
  chain_index: string;
  signal_strength: number;
}

export interface Payment {
  id: string;
  created_at: string;
  from_agent: string;
  to_endpoint: string;
  amount_usdg: string;
  tx_hash: string;
  purpose: "signal" | "score";
}

export interface TradeSummary {
  total: number;
  success: number;
  failed: number;
  totalOkbSpent: number;
  mesh: MeshStatus;
}

export const api = {
  getMeshStatus: () =>
    apiFetch<{ success: boolean; data: MeshStatus }>("/mesh/status"),

  getMeshSummary: () =>
    apiFetch<{ success: boolean; data: TradeSummary }>("/mesh/summary"),

  getTrades: () =>
    apiFetch<{ success: boolean; data: Trade[] }>("/mesh/trades"),

  getSignals: () =>
    apiFetch<{ success: boolean; data: Signal[] }>("/mesh/signals"),

  getPayments: () =>
    apiFetch<{ success: boolean; data: Payment[] }>("/mesh/payments"),

  startMesh: () =>
    apiFetch<{ success: boolean }>("/mesh/start", { method: "POST" }),

  stopMesh: () =>
    apiFetch<{ success: boolean }>("/mesh/stop", { method: "POST" }),
};
