import { okxFetch } from "./client";
import { XLAYER_CHAIN_INDEX } from "../../config/chains";
import type { OkxHotToken } from "../../types";

interface HotTokenResponse {
  code: string;
  msg: string;
  data: OkxHotToken[];
}

/**
 * Get hot/trending tokens on X Layer.
 * Uses /api/v6/dex/market/token/hot-token with rankingType=4 (trending score).
 * Fallback when Signal API returns empty.
 */
export async function getHotTokens(limit = 10): Promise<OkxHotToken[]> {
  const response = await okxFetch<HotTokenResponse>(
    "/api/v6/dex/market/token/hot-token",
    {
      params: {
        chainIndex: XLAYER_CHAIN_INDEX,
        rankingType: "4",
      },
    },
  );

  const tokens = response.data ?? [];
  return tokens.slice(0, limit);
}

/**
 * Get the top hot token as fallback signal source.
 * Sorted by volume descending as a momentum proxy.
 */
export async function getTopHotToken(): Promise<OkxHotToken | null> {
  const tokens = await getHotTokens(10);
  if (tokens.length === 0) return null;

  return tokens.sort(
    (a, b) =>
      Number.parseFloat(b.volume ?? "0") - Number.parseFloat(a.volume ?? "0"),
  )[0];
}

/**
 * Get detailed info for a specific token.
 */
export async function getTokenInfo(tokenAddress: string) {
  interface TokenInfoResponse {
    code: string;
    msg: string;
    data: Array<{
      tokenContractAddress: string;
      symbol: string;
      tokenName: string;
      decimals: string;
      totalSupply: string;
      price: string;
      volume24h: string;
      marketCap?: string;
      logoUrl?: string;
    }>;
  }

  const response = await okxFetch<TokenInfoResponse>(
    "/api/v6/dex/token/token-list",
    {
      params: {
        chainIndex: XLAYER_CHAIN_INDEX,
        tokenContractAddress: tokenAddress,
      },
    },
  );

  return response.data?.[0] ?? null;
}
