import crypto from "node:crypto";
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
  extraData: Record<string, unknown>;
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
    expiresAt: Number(verifyResp.sessionKeyExpireAt),
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
  value: string;
  inputData?: string;
  gasLimit?: string;
}): Promise<PreTxUnsignedInfo> {
  const session = await getAuthedSession(params.accountId);
  return walletPost<PreTxUnsignedInfo>(
    `${WALLET_PREFIX}/pre-transaction/unsignedInfo`,
    {
      chainPath: "m/44/60",
      chainIndex: params.chainIndex,
      fromAddr: params.fromAddr,
      toAddr: params.toAddr,
      value: params.value,
      sessionCert: session.sessionCert,
      ...(params.inputData ? { inputData: params.inputData } : {}),
      ...(params.gasLimit ? { gasLimit: params.gasLimit } : {}),
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
