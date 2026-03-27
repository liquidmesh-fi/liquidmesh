import { okxFetch } from "./client";
import { XLAYER_CHAIN_INDEX } from "../../config/chains";
import type { OkxSignalToken } from "../../types";

interface SignalListResponse {
  code: string;
  msg: string;
  data: OkxSignalToken[];
}

export interface SignalResult {
  tokenAddress: string;
  tokenSymbol: string;
  chainIndex: string;
  signalStrength: number;
  walletType?: string;
  rawData: OkxSignalToken;
}

/**
 * Fetch smart money / whale buy signals for X Layer.
 * Returns top signal sorted by strength descending.
 */
export async function getTopSignal(): Promise<SignalResult | null> {
  const response = await okxFetch<SignalListResponse>(
    "/api/v6/dex/market/signal/list",
    {
      method: "POST",
      body: {
        chainIndex: XLAYER_CHAIN_INDEX,
        walletType: "1", // smart money
        minAmountUsd: "100",
        limit: "10",
      },
    },
  );

  const signals = response.data ?? [];
  if (signals.length === 0) return null;

  // Sort by signalStrength descending
  const sorted = signals
    .filter((s) => s.tokenContractAddress && s.tokenContractAddress !== "")
    .sort((a, b) => (b.signalStrength ?? 0) - (a.signalStrength ?? 0));

  const top = sorted[0];
  if (!top) return null;

  return {
    tokenAddress: top.tokenContractAddress,
    tokenSymbol: top.symbol ?? "UNKNOWN",
    chainIndex: top.chainIndex ?? XLAYER_CHAIN_INDEX,
    signalStrength: top.signalStrength ?? 0,
    walletType: top.walletType,
    rawData: top,
  };
}

/**
 * Fetch all signals for X Layer (for storage/display).
 */
export async function getAllSignals(): Promise<SignalResult[]> {
  const response = await okxFetch<SignalListResponse>(
    "/api/v6/dex/market/signal/list",
    {
      method: "POST",
      body: {
        chainIndex: XLAYER_CHAIN_INDEX,
        walletType: "1",
        minAmountUsd: "50",
        limit: "20",
      },
    },
  );

  const signals = response.data ?? [];
  return signals
    .filter((s) => s.tokenContractAddress)
    .map((s) => ({
      tokenAddress: s.tokenContractAddress,
      tokenSymbol: s.symbol ?? "UNKNOWN",
      chainIndex: s.chainIndex ?? XLAYER_CHAIN_INDEX,
      signalStrength: s.signalStrength ?? 0,
      walletType: s.walletType,
      rawData: s,
    }));
}
