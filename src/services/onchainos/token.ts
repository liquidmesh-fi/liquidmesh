import { okxFetch } from "./client";
import { XLAYER_CHAIN_INDEX } from "../../config/chains";
import type { OkxTrendingToken } from "../../types";

interface TrendingResponse {
  code: string;
  msg: string;
  data: OkxTrendingToken[];
}

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

/**
 * Get trending tokens on X Layer — fallback when Signal API returns empty.
 * rankingType: 4 = trending score, 5 = Twitter/X mentions
 */
export async function getTrendingTokens(
  limit = 10,
): Promise<OkxTrendingToken[]> {
  const response = await okxFetch<TrendingResponse>(
    "/api/v6/dex/token/trending",
    {
      params: {
        chainIndex: XLAYER_CHAIN_INDEX,
        rankingType: "4",
        limit: String(limit),
      },
    },
  );

  return response.data ?? [];
}

/**
 * Get top trending token as fallback signal source.
 */
export async function getTopTrendingToken(): Promise<OkxTrendingToken | null> {
  const tokens = await getTrendingTokens(5);
  if (tokens.length === 0) return null;

  // Sort by 24h price change as a proxy for momentum
  return tokens.sort(
    (a, b) =>
      Math.abs(Number.parseFloat(b.priceChangePercent24h ?? "0")) -
      Math.abs(Number.parseFloat(a.priceChangePercent24h ?? "0")),
  )[0];
}

/**
 * Get detailed info for a specific token.
 */
export async function getTokenInfo(tokenAddress: string) {
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
