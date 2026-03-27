import { okxFetch } from "./client";
import { XLAYER_CHAIN_INDEX } from "../../config/chains";

interface AllBalancesResponse {
  code: string;
  msg: string;
  data: Array<{
    tokenAssets: Array<{
      chainIndex: string;
      tokenContractAddress: string;
      symbol: string;
      balance: string;
      tokenPrice: string;
      usdValue: string;
    }>;
    totalValue: string;
  }>;
}

export interface TokenBalance {
  chainIndex: string;
  tokenAddress: string;
  symbol: string;
  balance: string;
  usdValue: string;
  price: string;
}

/**
 * Get all token balances for a wallet address on X Layer.
 */
export async function getAllBalances(address: string): Promise<{
  tokens: TokenBalance[];
  totalUsdValue: string;
}> {
  const response = await okxFetch<AllBalancesResponse>(
    "/api/v6/dex/balance/all-token-balances-by-address",
    {
      params: {
        address,
        chains: XLAYER_CHAIN_INDEX,
      },
    },
  );

  const data = response.data?.[0];
  if (!data) return { tokens: [], totalUsdValue: "0" };

  return {
    tokens: (data.tokenAssets ?? []).map((t) => ({
      chainIndex: t.chainIndex,
      tokenAddress: t.tokenContractAddress,
      symbol: t.symbol,
      balance: t.balance,
      usdValue: t.usdValue,
      price: t.tokenPrice,
    })),
    totalUsdValue: data.totalValue ?? "0",
  };
}

/**
 * Get OKB native balance for an address.
 */
export async function getOkbBalance(address: string): Promise<string> {
  const { tokens } = await getAllBalances(address);
  const okb = tokens.find(
    (t) =>
      t.tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ||
      t.symbol === "OKB",
  );
  return okb?.balance ?? "0";
}
