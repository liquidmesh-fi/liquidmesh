// Shared types across the LiquidMesh system

// --- OKX API ---

// Signal list item from /api/v6/dex/market/signal/list
export interface OkxSignalItem {
  chainIndex: string;
  amountUsd: string;
  price: string;
  soldRatioPercent: string;
  timestamp: string;
  walletType: string;
  triggerWalletAddress: string;
  triggerWalletCount: string;
  cursor: string;
  token: {
    tokenAddress: string;
    symbol: string;
    name: string;
    holders: string;
    logo: string;
    marketCapUsd: string;
    top10HolderPercent: string;
  };
}

// Hot token item from /api/v6/dex/market/token/hot-token
export interface OkxHotToken {
  chainIndex: string;
  tokenContractAddress: string;
  tokenSymbol: string;
  price: string;
  change: string; // 24h price change %
  marketCap: string;
  holders: string;
  liquidity: string;
  volume: string;
  txs: string;
  uniqueTraders: string;
  riskLevelControl: string;
  tokenLogoUrl?: string;
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
