import { Hono } from "hono";
import {
  verifyIncomingPayment,
  buildPaymentResponse,
  X402_SIGNAL_PRICE,
} from "../services/onchainos/payments";
import { getRecentSignals } from "../memory/db";
import { XLAYER_USDG, XLAYER_X402_NETWORK } from "../config/chains";
import { env } from "../env";
import { insertPayment } from "../memory/db";

export const scoutRouter = new Hono();

/**
 * x402-protected endpoint: returns latest signal.
 * Callers must include X-Payment header with valid payment authorization.
 */
scoutRouter.get("/signal", async (c) => {
  const xPayment = c.req.header("X-Payment");

  if (!xPayment) {
    // Return 402 with payment requirement
    const paymentRequired = {
      x402Version: 1,
      accepts: [
        {
          scheme: "exact",
          network: XLAYER_X402_NETWORK,
          maxAmountRequired: X402_SIGNAL_PRICE,
          resource: `${env.PUBLIC_API_URL}/scout/signal`,
          description: "LiquidMesh Scout: latest smart money signal",
          mimeType: "application/json",
          payTo: env.SCOUT_WALLET_ADDRESS,
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

  // Verify payment
  try {
    const payment = verifyIncomingPayment(xPayment);
    const signals = await getRecentSignals(1);
    const latest = signals[0] ?? null;

    // Record the payment
    if (latest) {
      await insertPayment({
        from_agent: payment.from,
        to_endpoint: "/scout/signal",
        amount_usdg: X402_SIGNAL_PRICE,
        tx_hash: `x402-${Date.now()}`,
        purpose: "signal",
      });
    }

    return c.json(
      { success: true, data: latest },
      200,
      {
        "X-Payment-Response": buildPaymentResponse(`x402-signal-${Date.now()}`),
      },
    );
  } catch (err) {
    return c.json({ error: "Invalid payment", details: String(err) }, 402);
  }
});
