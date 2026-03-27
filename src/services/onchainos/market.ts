import { okxFetch } from "./client";
import { XLAYER_CHAIN_INDEX } from "../../config/chains";

interface PriceResponse {
  code: string;
  msg: string;
  data: Array<{
    chainIndex: string;
    tokenContractAddress: string;
    price: string;
    priceChange24h: string;
    volume24h?: string;
  }>;
}

/**
 * Get current price for a token on X Layer.
 */
export async function getTokenPrice(tokenAddress: string): Promise<{
  price: string;
  priceChange24h: string;
} | null> {
  const response = await okxFetch<PriceResponse>(
    "/api/v6/dex/market/price",
    {
      method: "POST",
      body: [{ chainIndex: XLAYER_CHAIN_INDEX, tokenContractAddress: tokenAddress }],
    },
  );

  const item = response.data?.[0];
  if (!item) return null;

  return {
    price: item.price,
    priceChange24h: item.priceChange24h,
  };
}

/**
 * Get prices for multiple tokens at once.
 */
export async function getTokenPrices(
  tokenAddresses: string[],
): Promise<Record<string, string>> {
  const response = await okxFetch<PriceResponse>(
    "/api/v6/dex/market/price",
    {
      method: "POST",
      body: tokenAddresses.map((addr) => ({
        chainIndex: XLAYER_CHAIN_INDEX,
        tokenContractAddress: addr,
      })),
    },
  );

  const result: Record<string, string> = {};
  for (const item of response.data ?? []) {
    result[item.tokenContractAddress] = item.price;
  }
  return result;
}
