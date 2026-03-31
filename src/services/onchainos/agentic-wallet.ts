import crypto from "node:crypto";
import { Aead, CipherSuite, Kdf, Kem } from "hpke-js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { env } from "../../env";

const OKX_BASE = "https://web3.okx.com";
const WALLET_PREFIX = "/priapi/v5/wallet/agentic";

interface AkInitResponse {
  nonce: string;
  iss: string;
}

interface VerifyResponse {
  accessToken: string;
  refreshToken: string;
  sessionCert: string;
  encryptedSessionSk: string;
  sessionKeyExpireAt: string;
  projectId: string;
  accountId: string;
  accountName: string;
  isNew: boolean;
  addressList: Array<{
    accountId?: string;
    address: string;
    chainIndex: string;
    chainName: string;
    addressType: string;
  }>;
  teeId: string;
}

interface WalletSession {
  accessToken: string;
  refreshToken: string;
  sessionCert: string;
  sessionPrivateKey: string;
  encryptedSessionSk: string;
  projectId: string;
  accountId: string;
  accountName: string;
  expiresAt: number;
}

export interface PreTxUnsignedInfo {
  unsignedTxHash: string;
  unsignedTx: string;
  uopHash: string;
  hash: string;
  executeErrorMsg: string;
  executeResult: boolean;
  signType: string;
  encoding: string;
  extraData: Record<string, unknown>;
  authHashFor7702?: string;
}

// Per-account session cache — key is accountId
const sessionCache = new Map<string, WalletSession>();
const DEFAULT_CACHE_KEY = "__default__";

function anonymousHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "ok-client-version": "2.1.0",
    "Ok-Access-Client-type": "agent-cli",
  };
}

function jwtHeaders(accessToken: string): Record<string, string> {
  return { ...anonymousHeaders(), Authorization: `Bearer ${accessToken}` };
}

function generateX25519Keypair(): { privateKeyB64: string; publicKeyB64: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("x25519");
  const pubDer = publicKey.export({ type: "spki", format: "der" });
  const privDer = privateKey.export({ type: "pkcs8", format: "der" });
  const rawPub = Buffer.from(pubDer).subarray(pubDer.length - 32);
  const rawPriv = Buffer.from(privDer).subarray(privDer.length - 32);
  return {
    publicKeyB64: rawPub.toString("base64"),
    privateKeyB64: rawPriv.toString("base64"),
  };
}

function hmacSign(
  timestamp: number,
  method: string,
  path: string,
  params: string,
  secretKey: string,
): string {
  const message = `${timestamp}${method}${path}${params}`;
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(message);
  return hmac.digest("base64");
}

async function walletPost<T>(
  path: string,
  body: Record<string, unknown>,
  headers: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${OKX_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (res.status >= 500) {
    throw new Error(`Wallet API server error (HTTP ${res.status})`);
  }

  const json = (await res.json()) as { code: string | number; msg: string; data: T[] };
  if (json.code !== "0" && json.code !== 0) {
    throw new Error(`Wallet API error [${json.code}]: ${json.msg}`);
  }

  return json.data[0] as T;
}

/**
 * Create or return a cached TEE session for the given accountId.
 * Passing accountId in ak/verify tells OKX which sub-account's TEE key to use for signing.
 */
export async function akLogin(accountId?: string): Promise<WalletSession> {
  const cacheKey = accountId ?? DEFAULT_CACHE_KEY;
  const cached = sessionCache.get(cacheKey);
  if (cached && Date.now() / 1000 < cached.expiresAt - 60) {
    return cached;
  }

  const initResp = await walletPost<AkInitResponse>(
    `${WALLET_PREFIX}/auth/ak/init`,
    { apiKey: env.OKX_API_KEY },
    anonymousHeaders(),
  );

  const { privateKeyB64, publicKeyB64 } = generateX25519Keypair();

  const timestamp = Date.now();
  const sign = hmacSign(
    timestamp,
    "GET",
    "/web3/ak/agentic/login",
    `?locale=en-US&nonce=${initResp.nonce}&iss=${initResp.iss}`,
    env.OKX_SECRET_KEY,
  );

  const verifyBody: Record<string, string> = {
    tempPubKey: publicKeyB64,
    apiKey: env.OKX_API_KEY,
    passphrase: env.OKX_PASSPHRASE,
    timestamp: timestamp.toString(),
    sign,
    locale: "en-US",
  };

  // Pass target accountId so OKX TEE creates the session for the correct sub-account
  if (accountId) verifyBody.accountId = accountId;

  const verifyResp = await walletPost<VerifyResponse>(
    `${WALLET_PREFIX}/auth/ak/verify`,
    verifyBody,
    anonymousHeaders(),
  );

  const session: WalletSession = {
    accessToken: verifyResp.accessToken,
    refreshToken: verifyResp.refreshToken,
    sessionCert: verifyResp.sessionCert,
    sessionPrivateKey: privateKeyB64,
    encryptedSessionSk: verifyResp.encryptedSessionSk,
    projectId: verifyResp.projectId,
    accountId: verifyResp.accountId,
    accountName: verifyResp.accountName,
    expiresAt: (() => {
      const raw = Number(verifyResp.sessionKeyExpireAt);
      return raw > 1e12 ? Math.floor(raw / 1000) : raw;
    })(),
  };

  sessionCache.set(cacheKey, session);
  return session;
}

async function getAuthedSession(accountId?: string): Promise<WalletSession> {
  const cacheKey = accountId ?? DEFAULT_CACHE_KEY;
  const cached = sessionCache.get(cacheKey);
  if (!cached || Date.now() / 1000 >= cached.expiresAt - 60) {
    return akLogin(accountId);
  }
  return cached;
}

export async function preTransactionUnsignedInfo(params: {
  accountId: string;
  chainIndex: number;
  fromAddr: string;
  toAddr: string;
  amount: string;
  contractAddr?: string;
  inputData?: string;
  gasLimit?: string;
  aaDexTokenAddr?: string;
  aaDexTokenAmount?: string;
}): Promise<PreTxUnsignedInfo> {
  const session = await getAuthedSession(params.accountId);
  return walletPost<PreTxUnsignedInfo>(
    `${WALLET_PREFIX}/pre-transaction/unsignedInfo`,
    {
      chainPath: "m/44/60",
      chainIndex: params.chainIndex,
      fromAddr: params.fromAddr,
      toAddr: params.toAddr,
      amount: params.amount,
      sessionCert: session.sessionCert,
      ...(params.contractAddr ? { contractAddr: params.contractAddr } : {}),
      ...(params.inputData ? { inputData: params.inputData } : {}),
      ...(params.gasLimit ? { gasLimit: params.gasLimit } : {}),
      ...(params.aaDexTokenAddr ? { aaDexTokenAddr: params.aaDexTokenAddr } : {}),
      ...(params.aaDexTokenAmount ? { aaDexTokenAmount: params.aaDexTokenAmount } : {}),
    },
    jwtHeaders(session.accessToken),
  );
}

export async function broadcastAgenticTransaction(params: {
  accountId: string;
  address: string;
  chainIndex: string;
  extraData: string;
}): Promise<{ pkgId: string; orderId: string; txHash: string }> {
  const session = await getAuthedSession(params.accountId);
  return walletPost<{ pkgId: string; orderId: string; txHash: string }>(
    `${WALLET_PREFIX}/pre-transaction/broadcast-transaction`,
    params,
    jwtHeaders(session.accessToken),
  );
}

// ── Crypto helpers ────────────────────────────────────────────────────────────

const HPKE_INFO = new TextEncoder().encode("okx-tee-sign");
const ED25519_PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

async function hpkeDecryptSessionSk(encryptedB64: string, sessionKeyB64: string): Promise<Uint8Array> {
  const encrypted = Buffer.from(encryptedB64, "base64");
  const skBytes = Buffer.from(sessionKeyB64, "base64");

  if (skBytes.length !== 32) throw new Error(`session key must be 32 bytes, got ${skBytes.length}`);
  if (encrypted.length <= 32) throw new Error(`encrypted blob too short: ${encrypted.length}`);

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

function ed25519SignEip191(hexHash: string, seed: Uint8Array): string {
  const data = Buffer.from(hexHash.replace(/^0x/, ""), "hex");
  const prefix = `\x19Ethereum Signed Message:\n${data.length}`;
  const ethMsg = Buffer.concat([Buffer.from(prefix), data]);
  const msgHash = keccak_256(ethMsg);
  return Buffer.from(ed25519Sign(seed, msgHash)).toString("base64");
}

function ed25519SignEncoded(msg: string, seed: Uint8Array, encoding: string): string {
  if (!msg) return "";
  let msgBytes: Buffer;
  if (encoding === "hex") {
    msgBytes = Buffer.from(msg.replace(/^0x/, ""), "hex");
  } else if (encoding === "base64") {
    msgBytes = Buffer.from(msg, "base64");
  } else {
    msgBytes = Buffer.from(msg, "utf-8");
  }
  return Buffer.from(ed25519Sign(seed, msgBytes)).toString("base64");
}

/**
 * Sign unsignedInfo and broadcast. Replaces the raw broadcastAgenticTransaction call
 * when signing is required (AA wallet swap).
 */
export async function signAndBroadcast(params: {
  accountId: string;
  address: string;
  chainIndex: string;
  unsignedInfo: PreTxUnsignedInfo;
}): Promise<{ pkgId: string; orderId: string; txHash: string }> {
  const session = await getAuthedSession(params.accountId);

  const seed = await hpkeDecryptSessionSk(session.encryptedSessionSk, session.sessionPrivateKey);

  const msgForSign: Record<string, unknown> = {};

  if (params.unsignedInfo.hash) {
    msgForSign.signature = ed25519SignEip191(params.unsignedInfo.hash, seed);
  }
  if (params.unsignedInfo.unsignedTxHash) {
    msgForSign.unsignedTxHash = params.unsignedInfo.unsignedTxHash;
    msgForSign.sessionSignature = ed25519SignEncoded(
      params.unsignedInfo.unsignedTxHash,
      seed,
      params.unsignedInfo.encoding,
    );
  }
  if (params.unsignedInfo.unsignedTx) {
    msgForSign.unsignedTx = params.unsignedInfo.unsignedTx;
  }
  if (session.sessionCert) {
    msgForSign.sessionCert = session.sessionCert;
  }

  const extraDataObj: Record<string, unknown> = {
    ...(typeof params.unsignedInfo.extraData === "object" ? params.unsignedInfo.extraData : {}),
    checkBalance: true,
    uopHash: params.unsignedInfo.uopHash,
    encoding: params.unsignedInfo.encoding,
    signType: params.unsignedInfo.signType,
    msgForSign,
  };

  return walletPost<{ pkgId: string; orderId: string; txHash: string }>(
    `${WALLET_PREFIX}/pre-transaction/broadcast-transaction`,
    {
      accountId: params.accountId,
      address: params.address,
      chainIndex: params.chainIndex,
      extraData: JSON.stringify(extraDataObj),
    },
    jwtHeaders(session.accessToken),
  );
}
