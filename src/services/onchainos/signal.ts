import { okxFetch } from "./client";
import { XLAYER_CHAIN_INDEX } from "../../config/chains";
import type { OkxSignalItem } from "../../types";

interface SignalListResponse {
  code: string;
  msg: string;
  data: OkxSignalItem[];
}

export interface SignalResult {
  tokenAddress: string;
  tokenSymbol: string;
  chainIndex: string;
  signalStrength: number;
  walletType?: string;
  rawData: OkxSignalItem;
}

export async function getTopSignal(): Promise<SignalResult | null> {
  const response = await okxFetch<SignalListResponse>(
    "/api/v6/dex/market/signal/list",
    {
      method: "POST",
      body: {
        chainIndex: XLAYER_CHAIN_INDEX,
        walletType: "1",
        minAmountUsd: "100",
        limit: "10",
      },
    },
  );

  const signals = response.data ?? [];
  if (signals.length === 0) return null;

  const sorted = signals
    .filter((s) => s.token?.tokenAddress)
    .sort(
      (a, b) =>
        Number.parseFloat(b.amountUsd) - Number.parseFloat(a.amountUsd),
    );

  const top = sorted[0];
  if (!top) return null;

  return {
    tokenAddress: top.token.tokenAddress,
    tokenSymbol: top.token.symbol,
    chainIndex: top.chainIndex,
    signalStrength: Number.parseFloat(top.amountUsd),
    walletType: top.walletType,
    rawData: top,
  };
}

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
    .filter((s) => s.token?.tokenAddress)
    .map((s) => ({
      tokenAddress: s.token.tokenAddress,
      tokenSymbol: s.token.symbol,
      chainIndex: s.chainIndex,
      signalStrength: Number.parseFloat(s.amountUsd),
      walletType: s.walletType,
      rawData: s,
    }));
}
