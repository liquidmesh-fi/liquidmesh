// Shared types across the LiquidMesh system

// --- OKX API ---

export interface OkxSignalToken {
  chainIndex: string;
  tokenContractAddress: string;
  symbol: string;
  signalStrength?: number;
  buyAmount?: string;
  walletAddress?: string;
  walletType?: string;
}

export interface OkxSignalResponse {
  code: string;
  msg: string;
  data: OkxSignalToken[];
}

export interface OkxTrendingToken {
  chainIndex: string;
  tokenContractAddress: string;
  symbol: string;
  price: string;
  priceChangePercent24h: string;
  volume24h?: string;
}

export interface OkxTokenScanResult {
  chainId: string;
  contractAddress: string;
  riskLevel: "low" | "medium" | "high";
  isHoneypot: boolean;
  holders?: number;
  riskItems: Array<{ title: string; desc: string }>;
}

export interface OkxSwapQuote {
  fromTokenAmount: string;
  toTokenAmount: string;
  priceImpact: string;
  tradeFee: string;
  estimatedGas: string;
}

export interface OkxSwapTransaction {
  data: string;
  from: string;
  gas: string;
  gasPrice: string;
  to: string;
  value: string;
  minOutAmount: string;
}

// --- x402 Protocol ---

export interface X402PaymentRequirement {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: {
    name?: string;
    version?: string;
  };
}

export interface X402PaymentHeader {
  x402Version: number;
  accepts: X402PaymentRequirement[];
}

// --- Agent System ---

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

// --- API Responses ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agent: string;
  type: "signal" | "score" | "trade" | "payment" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}
