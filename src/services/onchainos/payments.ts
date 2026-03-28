import crypto from "node:crypto";
import { Aead, CipherSuite, Kdf, Kem } from "hpke-js";
import { XLAYER_CHAIN_INDEX, XLAYER_USDG, XLAYER_X402_NETWORK } from "../../config/chains";
import { okxFetch } from "./client";
import { akLogin } from "./agentic-wallet";

export const X402_SIGNAL_PRICE = "1000"; // 0.001 USDG (6 decimals)
export const X402_SCORE_PRICE = "2000";  // 0.002 USDG (6 decimals)

const OKX_BASE = "https://web3.okx.com";
const WALLET_PREFIX = "/priapi/v5/wallet/agentic";
const HPKE_INFO = new TextEncoder().encode("okx-tee-sign");
const ED25519_PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

interface X402Requirement {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: Record<string, unknown>;
}

interface X402PaymentRequired {
  x402Version: number;
  resource?: Record<string, unknown>;
  accepts: X402Requirement[];
}

interface X402Authorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

interface X402Proof {
  signature: string;
  authorization: X402Authorization;
}

export interface X402SettleResult {
  txHash: string;
  body: unknown;
  amount: string;
  currency: string;
}

// ── Server-side: OKX x402 verify ────────────────────────────────────────────

interface OkxX402VerifyResponse {
  code: string;
  data: Array<{
    isValid: boolean;
    payer: string;
    invalidReason: string | null;
  }>;
}

interface OkxX402SettleResponse {
  code: string;
  data: Array<{
    success: boolean;
    txHash: string;
    payer: string;
    errorReason: string | null;
    chainIndex: string;
  }>;
}

/**
 * Server-side: call OKX /api/v6/x402/verify to validate an incoming EIP-3009 payment.
 * Called by Scout/Analyst route handlers when they receive an X-Payment header.
 */
export async function okxVerifyX402Payment(
  xPaymentHeader: string,
  payTo: string,
  maxAmount: string,
): Promise<{ isValid: boolean; payer: string; invalidReason: string | null }> {
  const decoded = JSON.parse(Buffer.from(xPaymentHeader, "base64").toString("utf-8"));
  const accepted: X402Requirement = decoded.accepted ?? {};

  const response = await okxFetch<OkxX402VerifyResponse>("/api/v6/x402/verify", {
    method: "POST",
    body: {
      x402Version: decoded.x402Version ?? 1,
      chainIndex: XLAYER_CHAIN_INDEX,
      paymentPayload: {
        x402Version: decoded.x402Version ?? 1,
        scheme: accepted.scheme ?? "exact",
        payload: decoded.payload,
      },
      paymentRequirements: {
        scheme: "exact",
        maxAmountRequired: maxAmount,
        payTo,
        asset: XLAYER_USDG,
        maxTimeoutSeconds: 300,
        extra: { name: "USDG", version: "2" },
      },
    },
  });

  const result = response.data?.[0];
  if (!result) throw new Error("OKX x402 verify returned no data");
  return result;
}

/**
 * Server-side: call OKX /api/v6/x402/settle to execute the on-chain USDG transfer.
 * Returns a real txHash from X Layer.
 */
export async function okxSettleX402Payment(
  xPaymentHeader: string,
  payTo: string,
  maxAmount: string,
  resource: string,
  description: string,
): Promise<{ success: boolean; txHash: string; payer: string; errorReason: string | null }> {
  const decoded = JSON.parse(Buffer.from(xPaymentHeader, "base64").toString("utf-8"));
  const accepted: X402Requirement = decoded.accepted ?? {};

  const response = await okxFetch<OkxX402SettleResponse>("/api/v6/x402/settle", {
    method: "POST",
    body: {
      x402Version: decoded.x402Version ?? 1,
      chainIndex: XLAYER_CHAIN_INDEX,
      syncSettle: true,
      paymentPayload: {
        x402Version: decoded.x402Version ?? 1,
        scheme: accepted.scheme ?? "exact",
        payload: decoded.payload,
      },
      paymentRequirements: {
        scheme: "exact",
        resource,
        description,
        mimeType: "application/json",
        maxAmountRequired: maxAmount,
        payTo,
        asset: XLAYER_USDG,
        maxTimeoutSeconds: 300,
        extra: { name: "USDG", version: "2" },
      },
    },
  });

  const result = response.data?.[0];
  if (!result) throw new Error("OKX x402 settle returned no data");
  return result;
}

// ── Client-side: build X-Payment header ─────────────────────────────────────

function encodeB64(data: string): string {
  return Buffer.from(data, "utf-8").toString("base64");
}

function decodeB64(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8");
}

async function hpkeDecryptSessionSk(encryptedB64: string, sessionKeyB64: string): Promise<Uint8Array> {
  const encrypted = Buffer.from(encryptedB64, "base64");
  const skBytes = Buffer.from(sessionKeyB64, "base64");

  if (skBytes.length !== 32) throw new Error(`session key must be 32 bytes, got ${skBytes.length}`);
  if (encrypted.length <= 32) throw new Error(`encrypted blob too short: ${encrypted.length} bytes`);

  const enc = encrypted.subarray(0, 32);
  const ciphertext = encrypted.subarray(32);

  const suite = new CipherSuite({
    kem: Kem.DhkemX25519HkdfSha256,
    kdf: Kdf.HkdfSha256,
    aead: Aead.Aes256Gcm,
  });

  const recipientKey = await suite.importKey(
    "raw",
    skBytes.buffer.slice(skBytes.byteOffset, skBytes.byteOffset + skBytes.byteLength) as ArrayBuffer,
    false,
  );
  const ctx = await suite.createRecipientContext({ recipientKey, enc, info: HPKE_INFO });
  const plaintext = await ctx.open(ciphertext, new Uint8Array(0));
  const seed = new Uint8Array(plaintext);

  if (seed.length !== 32) throw new Error(`decrypted seed must be 32 bytes, got ${seed.length}`);
  return seed;
}

function ed25519Sign(seed: Uint8Array, message: Uint8Array): Uint8Array {
  const der = Buffer.concat([ED25519_PKCS8_PREFIX, seed]);
  const privateKey = crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  return new Uint8Array(crypto.sign(null, message, privateKey));
}

async function signX402(
  payerAddress: string,
  accountId: string,
  requirement: X402Requirement,
): Promise<X402Proof> {
  const session = await akLogin(accountId);

  const now = Math.floor(Date.now() / 1000);
  const validBefore = (now + (requirement.maxTimeoutSeconds || 300)).toString();
  const nonce = `0x${Buffer.from(crypto.randomBytes(32)).toString("hex")}`;

  const baseFields = {
    accountId,
    chainIndex: Number(XLAYER_CHAIN_INDEX),
    from: payerAddress,
    to: requirement.payTo,
    value: requirement.amount,
    validAfter: "0",
    validBefore,
    nonce,
    verifyingContract: requirement.asset,
  };

  const headers = {
    "Content-Type": "application/json",
    "ok-client-version": "2.1.0",
    "Ok-Access-Client-type": "agent-cli",
    Authorization: `Bearer ${session.accessToken}`,
  };

  // Step 1: Get EIP-3009 unsigned hash from TEE
  const genHashRes = await fetch(`${OKX_BASE}${WALLET_PREFIX}/pre-transaction/gen-msg-hash`, {
    method: "POST",
    headers,
    body: JSON.stringify(baseFields),
  });
  const genHashJson = (await genHashRes.json()) as {
    code: string | number;
    msg: string;
    data: Array<{ msgHash: string; domainHash: string }>;
  };

  if (genHashJson.code !== "0" && genHashJson.code !== 0) {
    throw new Error(`gen-msg-hash failed [${genHashJson.code}]: ${genHashJson.msg}`);
  }

  const { msgHash, domainHash } = genHashJson.data[0];

  // Step 2: HPKE decrypt session key → Ed25519 seed → sign msgHash locally
  const seed = await hpkeDecryptSessionSk(session.encryptedSessionSk, session.sessionPrivateKey);
  const msgHashBytes = Buffer.from(msgHash.replace(/^0x/, ""), "hex");
  const sessionSignature = ed25519Sign(seed, msgHashBytes);
  const sessionSignatureB64 = Buffer.from(sessionSignature).toString("base64");

  // Step 3: TEE produces final EIP-3009 signature
  const signRes = await fetch(`${OKX_BASE}${WALLET_PREFIX}/pre-transaction/sign-msg`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...baseFields,
      domainHash,
      sessionCert: session.sessionCert,
      sessionSignature: sessionSignatureB64,
    }),
  });
  const signJson = (await signRes.json()) as {
    code: string | number;
    msg: string;
    data: Array<{ signature: string }>;
  };

  if (signJson.code !== "0" && signJson.code !== 0) {
    throw new Error(`sign-msg failed [${signJson.code}]: ${signJson.msg}`);
  }

  return {
    signature: signJson.data[0].signature,
    authorization: {
      from: payerAddress,
      to: requirement.payTo,
      value: requirement.amount,
      validAfter: "0",
      validBefore,
      nonce,
    },
  };
}

/**
 * Client-side: full x402 settle flow.
 * 1. Probe endpoint → get 402 + payment requirements
 * 2. TEE sign EIP-3009 transferWithAuthorization (from payer's sub-account)
 * 3. Replay request with signed X-Payment header
 * 4. Parse txHash from payment-response header
 */
export async function settleX402(
  serviceUrl: string,
  payerAddress: string,
  accountId: string,
): Promise<X402SettleResult> {
  // Step 1: Probe
  const probeRes = await fetch(serviceUrl, { method: "GET", signal: AbortSignal.timeout(10000) });

  if (probeRes.status !== 402) {
    const body = await probeRes.json().catch(() => ({}));
    return { txHash: "no-payment-required", body, amount: "0", currency: "USDG" };
  }

  const paymentHeader = probeRes.headers.get("X-Payment-Required");
  if (!paymentHeader) throw new Error("No X-Payment-Required header in 402 response");

  const decoded: X402PaymentRequired = JSON.parse(decodeB64(paymentHeader));
  if (!decoded.accepts?.length) throw new Error("No payment options in 402 response");

  // Prefer X Layer (eip155:196)
  const accepted =
    decoded.accepts.find(
      (a) => a.network === XLAYER_X402_NETWORK || a.network === `eip155:${XLAYER_CHAIN_INDEX}`,
    ) ?? decoded.accepts[0];

  // Ensure required metadata
  if (!accepted.asset) accepted.asset = XLAYER_USDG;
  if (!accepted.network || accepted.network === "unknown") accepted.network = XLAYER_X402_NETWORK;
  accepted.extra = { name: "USDG", version: "2" };

  // Step 2: TEE sign from the correct sub-account
  const proof = await signX402(payerAddress, accountId, accepted);

  // Step 3: Build payment payload
  const paymentPayload = {
    x402Version: decoded.x402Version ?? 1,
    ...(decoded.resource ? { resource: decoded.resource } : {}),
    accepted,
    payload: { signature: proof.signature, authorization: proof.authorization },
  };

  // Step 4: Replay with X-Payment header
  const replayRes = await fetch(serviceUrl, {
    method: "GET",
    headers: { "X-Payment": encodeB64(JSON.stringify(paymentPayload)) },
    signal: AbortSignal.timeout(30000),
  });

  if (!replayRes.ok) {
    const body = await replayRes.text();
    throw new Error(`x402 replay failed (${replayRes.status}): ${body.slice(0, 200)}`);
  }

  // Step 5: Parse txHash from payment-response
  const responseHeader = replayRes.headers.get("X-Payment-Response");
  let txHash = "";

  if (responseHeader) {
    try {
      const parsed = JSON.parse(decodeB64(responseHeader));
      txHash = parsed.txHash ?? parsed.transaction ?? "";
    } catch {
      txHash = "";
    }
  }

  if (!txHash) throw new Error("x402 settled but no txHash in payment-response");

  const body = await replayRes.json().catch(() => ({}));
  return { txHash, body, amount: accepted.amount, currency: "USDG" };
}

/**
 * Server-side: build X-Payment-Response header after OKX settles on-chain.
 */
export function buildPaymentResponse(txHash: string, payer = ""): string {
  return encodeB64(
    JSON.stringify({
      success: true,
      transaction: txHash,
      network: XLAYER_X402_NETWORK,
      payer,
      settledAt: Date.now(),
    }),
  );
}
