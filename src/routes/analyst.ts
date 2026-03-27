import { Hono } from "hono";
import {
  verifyIncomingPayment,
  buildPaymentResponse,
  X402_SCORE_PRICE,
} from "../services/onchainos/payments";
import { getRecentSignals, insertPayment } from "../memory/db";
import { supabase } from "../memory/db";
import { XLAYER_USDG, XLAYER_X402_NETWORK } from "../config/chains";
import { env } from "../env";

export const analystRouter = new Hono();

/**
 * x402-protected endpoint: returns latest risk score.
 * Callers must include X-Payment header with valid payment authorization.
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
          maxAmountRequired: X402_SCORE_PRICE,
          resource: `${env.PUBLIC_API_URL}/analyst/score`,
          description: "LiquidMesh Analyst: latest risk score and recommendation",
          mimeType: "application/json",
          payTo: env.ANALYST_WALLET_ADDRESS,
          maxTimeoutSeconds: 300,
          asset: XLAYER_USDG,
          extra: { name: "USDG", version: "1" },
        },
      ],
    };

    return c.json(
      { error: "Payment required", details: paymentRequired },
      402,
      {
        "X-Payment-Required": Buffer.from(
          JSON.stringify(paymentRequired),
        ).toString("base64"),
        "Content-Type": "application/json",
      },
    );
  }

  try {
    const payment = verifyIncomingPayment(xPayment);

    // Fetch latest score from Supabase
    const { data: scores } = await supabase
      .from("scores")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    const latest = scores?.[0] ?? null;

    if (latest) {
      await insertPayment({
        from_agent: payment.from,
        to_endpoint: "/analyst/score",
        amount_usdg: X402_SCORE_PRICE,
        tx_hash: `x402-${Date.now()}`,
        purpose: "score",
      });
    }

    return c.json(
      { success: true, data: latest },
      200,
      {
        "X-Payment-Response": buildPaymentResponse(`x402-score-${Date.now()}`),
      },
    );
  } catch (err) {
    return c.json({ error: "Invalid payment", details: String(err) }, 402);
  }
});
