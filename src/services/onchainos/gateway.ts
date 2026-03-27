import { okxFetch } from "./client";
import { XLAYER_CHAIN_INDEX } from "../../config/chains";

interface SimulateResponse {
  code: string;
  msg: string;
  data: Array<{
    success: boolean;
    reason?: string;
    gasUsed?: string;
  }>;
}

interface BroadcastResponse {
  code: string;
  msg: string;
  data: Array<{
    orderId: string;
    txHash?: string;
  }>;
}

interface GasPriceResponse {
  code: string;
  msg: string;
  data: Array<{
    normal: { gasPrice: string };
    fast: { gasPrice: string };
    fastest: { gasPrice: string };
  }>;
}

interface OrderStatusResponse {
  code: string;
  msg: string;
  data: Array<{
    orderId: string;
    txHash?: string;
    status: string;
    failReason?: string;
  }>;
}

/**
 * Simulate a transaction before broadcasting.
 */
export async function simulateTransaction(params: {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
}): Promise<{ success: boolean; reason?: string }> {
  const response = await okxFetch<SimulateResponse>(
    "/api/v6/dex/pre-transaction/simulate",
    {
      method: "POST",
      body: {
        chainIndex: XLAYER_CHAIN_INDEX,
        ...params,
      },
    },
  );

  const result = response.data?.[0];
  return {
    success: result?.success ?? false,
    reason: result?.reason,
  };
}

/**
 * Broadcast a signed transaction.
 * Returns orderId for status tracking.
 */
export async function broadcastTransaction(params: {
  signedTx: string;
  address: string;
}): Promise<{ orderId: string; txHash?: string }> {
  const response = await okxFetch<BroadcastResponse>(
    "/api/v6/dex/transaction/broadcast",
    {
      method: "POST",
      body: {
        chainIndex: XLAYER_CHAIN_INDEX,
        signedTx: params.signedTx,
        address: params.address,
      },
    },
  );

  const item = response.data?.[0];
  if (!item?.orderId) throw new Error("No orderId returned from broadcast");

  return { orderId: item.orderId, txHash: item.txHash };
}

/**
 * Get transaction status by orderId.
 */
export async function getTransactionStatus(orderId: string): Promise<{
  status: string;
  txHash?: string;
  failReason?: string;
}> {
  const response = await okxFetch<OrderStatusResponse>(
    "/api/v6/dex/transaction/orders",
    {
      params: { orderId, chainIndex: XLAYER_CHAIN_INDEX },
    },
  );

  const item = response.data?.[0];
  if (!item) throw new Error(`No order found for orderId: ${orderId}`);

  return {
    status: item.status,
    txHash: item.txHash,
    failReason: item.failReason,
  };
}

/**
 * Get current gas price on X Layer.
 */
export async function getGasPrice(): Promise<{
  normal: string;
  fast: string;
  fastest: string;
}> {
  const response = await okxFetch<GasPriceResponse>(
    "/api/v6/dex/pre-transaction/gas-price",
    {
      params: { chainIndex: XLAYER_CHAIN_INDEX },
    },
  );

  const data = response.data?.[0];
  return {
    normal: data?.normal.gasPrice ?? "1000000000",
    fast: data?.fast.gasPrice ?? "1200000000",
    fastest: data?.fastest.gasPrice ?? "1500000000",
  };
}
