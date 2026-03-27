import type { X402PaymentHeader, X402PaymentRequirement } from "../../types";

export const X402_SIGNAL_PRICE = "1000"; // 0.001 USDG
export const X402_SCORE_PRICE = "2000"; // 0.002 USDG

interface SettleResult {
  txHash: string;
  body: unknown;
}

/**
 * Probe an endpoint for x402 payment requirement.
 * Returns null if endpoint does not require payment.
 */
export async function probeX402(
  url: string,
): Promise<X402PaymentRequirement | null> {
  const res = await fetch(url, { method: "GET" });
  if (res.status !== 402) return null;

  const header = res.headers.get("X-Payment-Required");
  if (!header) return null;

  const parsed: X402PaymentHeader = JSON.parse(
    Buffer.from(header, "base64").toString(),
  );
  return parsed.accepts?.[0] ?? null;
}

/**
 * Sign an x402 payment authorization.
 * Encodes the payer's intent as base64 JSON — TEE signing is integrated at the OKX layer.
 */
export async function signX402Payment(
  payerAddress: string,
  requirement: X402PaymentRequirement,
): Promise<string> {
  const payload = {
    x402Version: 1,
    scheme: requirement.scheme,
    network: requirement.network,
    payload: {
      authorization: {
        from: payerAddress,
        to: requirement.payTo,
        value: requirement.maxAmountRequired,
        validAfter: Math.floor(Date.now() / 1000).toString(),
        validBefore: (Math.floor(Date.now() / 1000) + 300).toString(),
        nonce: crypto.randomUUID(),
      },
    },
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Full x402 settle flow: probe → sign → replay with X-Payment header → extract txHash.
 */
export async function settleX402(
  url: string,
  payerAddress: string,
): Promise<SettleResult> {
  const requirement = await probeX402(url);

  if (!requirement) {
    // Endpoint doesn't require payment — call directly
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Direct fetch ${url} → ${res.status}`);
    return { txHash: "no-payment-required", body: await res.json() };
  }

  const paymentToken = await signX402Payment(payerAddress, requirement);

  const res = await fetch(url, {
    headers: {
      "X-Payment": paymentToken,
    },
  });

  if (!res.ok && res.status !== 402) {
    throw new Error(`settleX402 replay ${url} → ${res.status}`);
  }

  if (res.status === 402) {
    throw new Error(`settleX402: payment rejected by ${url}`);
  }

  const paymentResponse = res.headers.get("X-Payment-Response");
  let txHash = "pending";
  if (paymentResponse) {
    try {
      const parsed = JSON.parse(
        Buffer.from(paymentResponse, "base64").toString(),
      );
      txHash = parsed.txHash ?? parsed.transaction ?? "pending";
    } catch {
      txHash = "pending";
    }
  }

  const body = await res.json();
  return { txHash, body };
}

/**
 * Verify an incoming x402 payment header on a server-side guarded endpoint.
 */
export function verifyIncomingPayment(xPaymentHeader: string): {
  from: string;
  amount: string;
  validBefore: string;
} {
  const decoded = JSON.parse(
    Buffer.from(xPaymentHeader, "base64").toString(),
  );

  const auth = decoded?.payload?.authorization;
  if (!auth?.from || !auth?.value || !auth?.validBefore) {
    throw new Error("Invalid x402 payment header: missing authorization fields");
  }

  const validBefore = Number.parseInt(auth.validBefore, 10);
  if (Date.now() / 1000 > validBefore) {
    throw new Error("x402 payment expired");
  }

  return {
    from: auth.from,
    amount: auth.value,
    validBefore: auth.validBefore,
  };
}

/**
 * Build the X-Payment-Response header returned to the payer after settlement.
 */
export function buildPaymentResponse(txHash: string): string {
  return Buffer.from(JSON.stringify({ txHash, settledAt: Date.now() })).toString("base64");
}
