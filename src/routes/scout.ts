import { Hono } from "hono";
import {
  okxVerifyX402Payment,
  okxSettleX402Payment,
  buildPaymentResponse,
  X402_SIGNAL_PRICE,
} from "../services/onchainos/payments";
import { getRecentSignals, insertPayment } from "../memory/db";
import { XLAYER_USDG, XLAYER_X402_NETWORK } from "../config/chains";
import { env } from "../env";

export const scoutRouter = new Hono();

/**
 * x402-protected endpoint: returns latest signal.
 * Callers must include X-Payment header with valid EIP-3009 payment authorization.
 * OKX facilitator executes the on-chain USDG transfer and returns a real txHash.
 */
scoutRouter.get("/signal", async (c) => {
  const xPayment = c.req.header("X-Payment");

  if (!xPayment) {
    const paymentRequired = {
      x402Version: 1,
      accepts: [
        {
          scheme: "exact",
          network: XLAYER_X402_NETWORK,
          amount: X402_SIGNAL_PRICE,
          maxAmountRequired: X402_SIGNAL_PRICE,
          resource: `${env.PUBLIC_API_URL}/scout/signal`,
          description: "LiquidMesh Scout: latest smart money signal on X Layer",
          mimeType: "application/json",
          payTo: env.SCOUT_WALLET_ADDRESS,
          maxTimeoutSeconds: 300,
          asset: XLAYER_USDG,
          extra: { name: "USDG", version: "2" },
        },
      ],
    };

    return c.json(
      { error: "Payment required", details: paymentRequired },
      402,
      {
        "X-Payment-Required": Buffer.from(JSON.stringify(paymentRequired)).toString("base64"),
        "Content-Type": "application/json",
      },
    );
  }

  try {
    // Step 1: Verify EIP-3009 signature with OKX
    const verification = await okxVerifyX402Payment(
      xPayment,
      env.SCOUT_WALLET_ADDRESS,
      X402_SIGNAL_PRICE,
    );

    if (!verification.isValid) {
      return c.json(
        { error: "Invalid payment", reason: verification.invalidReason },
        402,
      );
    }

    // Step 2: Settle on-chain via OKX facilitator → real txHash
    const settlement = await okxSettleX402Payment(
      xPayment,
      env.SCOUT_WALLET_ADDRESS,
      X402_SIGNAL_PRICE,
      `${env.PUBLIC_API_URL}/scout/signal`,
      "LiquidMesh Scout: latest smart money signal on X Layer",
    );

    if (!settlement.success) {
      return c.json(
        { error: "Payment settlement failed", reason: settlement.errorReason },
        402,
      );
    }

    // Step 3: Return resource + real txHash in response header
    const signals = await getRecentSignals(1);
    const latest = signals[0] ?? null;

    await insertPayment({
      from_agent: "analyst",
      to_endpoint: "/scout/signal",
      amount_usdg: (Number(X402_SIGNAL_PRICE) / 1e6).toFixed(6),
      tx_hash: settlement.txHash,
      purpose: "signal",
    });

    return c.json(
      { success: true, data: latest },
      200,
      {
        "X-Payment-Response": buildPaymentResponse(settlement.txHash, settlement.payer),
      },
    );
  } catch (err) {
    return c.json({ error: "Payment processing failed", details: String(err) }, 402);
  }
});
