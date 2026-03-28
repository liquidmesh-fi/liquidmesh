import { Hono } from "hono";
import {
  okxVerifyX402Payment,
  okxSettleX402Payment,
  buildPaymentResponse,
  X402_SCORE_PRICE,
} from "../services/onchainos/payments";
import { insertPayment, supabase } from "../memory/db";
import { XLAYER_USDG, XLAYER_X402_NETWORK } from "../config/chains";
import { env } from "../env";

export const analystRouter = new Hono();

/**
 * x402-protected endpoint: returns latest risk score.
 * Callers must include X-Payment header with valid EIP-3009 payment authorization.
 * OKX facilitator executes the on-chain USDG transfer and returns a real txHash.
 */
analystRouter.get("/score", async (c) => {
  const xPayment = c.req.header("X-Payment");

  if (!xPayment) {
    const paymentRequired = {
      x402Version: 1,
      accepts: [
        {
          scheme: "exact",
          network: XLAYER_X402_NETWORK,
          amount: X402_SCORE_PRICE,
          maxAmountRequired: X402_SCORE_PRICE,
          resource: `${env.PUBLIC_API_URL}/analyst/score`,
          description: "LiquidMesh Analyst: latest risk score and trade recommendation",
          mimeType: "application/json",
          payTo: env.ANALYST_WALLET_ADDRESS,
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
      env.ANALYST_WALLET_ADDRESS,
      X402_SCORE_PRICE,
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
      env.ANALYST_WALLET_ADDRESS,
      X402_SCORE_PRICE,
      `${env.PUBLIC_API_URL}/analyst/score`,
      "LiquidMesh Analyst: latest risk score and trade recommendation",
    );

    if (!settlement.success) {
      return c.json(
        { error: "Payment settlement failed", reason: settlement.errorReason },
        402,
      );
    }

    // Step 3: Return resource + real txHash in response header
    const { data: scores } = await supabase
      .from("scores")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    const latest = scores?.[0] ?? null;

    await insertPayment({
      from_agent: "executor",
      to_endpoint: "/analyst/score",
      amount_usdg: (Number(X402_SCORE_PRICE) / 1e6).toFixed(6),
      tx_hash: settlement.txHash,
      purpose: "score",
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
