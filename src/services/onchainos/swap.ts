import { okxFetch } from "./client";
import {
  XLAYER_CHAIN_INDEX,
  OKB_NATIVE,
  XLAYER_USDG,
} from "../../config/chains";
import type { OkxSwapQuote, OkxSwapTransaction } from "../../types";

interface SwapQuoteResponse {
  code: string;
  msg: string;
  data: Array<{
    fromTokenAmount: string;
    toTokenAmount: string;
    priceImpactPercentage: string;
    tradeFee: string;
    estimatedGas: string;
    routerResult?: unknown;
  }>;
}

interface SwapTransactionResponse {
  code: string;
  msg: string;
  data: Array<{
    tx: {
      data: string;
      from: string;
      gasLimit: string;
      gasPrice: string;
      to: string;
      value: string;
      minOutAmount: string;
    };
    routerResult?: unknown;
  }>;
}

interface ApproveResponse {
  code: string;
  msg: string;
  data: Array<{
    data: string;
    gasLimit: string;
    gasPrice: string;
    to: string;
  }>;
}

/**
 * Get a quote for swapping OKB → USDG on X Layer.
 */
export async function getSwapQuote(
  fromAmount: string,
  fromToken = OKB_NATIVE,
  toToken = XLAYER_USDG,
): Promise<OkxSwapQuote> {
  const response = await okxFetch<SwapQuoteResponse>(
    "/api/v6/dex/aggregator/quote",
    {
      params: {
        chainIndex: XLAYER_CHAIN_INDEX,
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: fromAmount,
      },
    },
  );

  const quote = response.data?.[0];
  if (!quote) throw new Error("No swap quote returned");

  return {
    fromTokenAmount: quote.fromTokenAmount,
    toTokenAmount: quote.toTokenAmount,
    priceImpact: quote.priceImpactPercentage ?? "0",
    tradeFee: quote.tradeFee ?? "0",
    estimatedGas: quote.estimatedGas ?? "0",
  };
}

/**
 * Get swap transaction data for OKB → USDG.
 */
export async function buildSwapTransaction(
  fromAmount: string,
  userAddress: string,
  fromToken = OKB_NATIVE,
  toToken = XLAYER_USDG,
  slippage = "0.5",
): Promise<OkxSwapTransaction> {
  const response = await okxFetch<SwapTransactionResponse>(
    "/api/v6/dex/aggregator/swap",
    {
      params: {
        chainIndex: XLAYER_CHAIN_INDEX,
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: fromAmount,
        userWalletAddress: userAddress,
        slippage: slippage,
      },
    },
  );

  const swap = response.data?.[0]?.tx;
  if (!swap) throw new Error("No swap transaction data returned");

  return {
    data: swap.data,
    from: swap.from,
    gas: swap.gasLimit,
    gasPrice: swap.gasPrice,
    to: swap.to,
    value: swap.value,
    minOutAmount: swap.minOutAmount,
  };
}

/**
 * Get approve transaction data (needed before ERC-20 swap).
 * Not needed for native OKB.
 */
export async function getApproveTransaction(
  tokenAddress: string,
  approveAmount: string,
) {
  const response = await okxFetch<ApproveResponse>(
    "/api/v6/dex/aggregator/approve-transaction",
    {
      params: {
        chainIndex: XLAYER_CHAIN_INDEX,
        tokenContractAddress: tokenAddress,
        approveAmount,
      },
    },
  );

  return response.data?.[0] ?? null;
}
