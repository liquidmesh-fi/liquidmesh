import { env } from "../../env";
import { OKX_API_BASE } from "../../config/chains";

interface AkSession {
  accessToken: string;
  sessionCert: string;
  encryptedSessionSk: string;
  expiresAt: number;
}

interface AkLoginResponse {
  code: string;
  data: Array<{
    accessToken: string;
    sessionCert: string;
    encryptedSessionSk: string;
    expiresIn?: number;
  }>;
}

interface AccountBalance {
  tokenAddress: string;
  symbol: string;
  balance: string;
  usdValue: string;
}

interface BalanceResponse {
  code: string;
  data: Array<{
    tokenAssets: AccountBalance[];
  }>;
}

// Module-level session cache
let cachedSession: AkSession | null = null;

function buildAkAuthHeaders(timestamp: string): Record<string, string> {
  const prehash = `${timestamp}GET/api/v5/waas/security/generate-challenge`;
  const encoder = new TextEncoder();
  const key = encoder.encode(env.OKX_SECRET_KEY);
  const msg = encoder.encode(prehash);
  const hmac = new Bun.CryptoHasher("sha256", key);
  hmac.update(msg);
  const signature = btoa(
    String.fromCharCode(...new Uint8Array(hmac.digest())),
  );

  return {
    "Content-Type": "application/json",
    "OK-ACCESS-KEY": env.OKX_API_KEY,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": env.OKX_PASSPHRASE,
  };
}

export async function akLogin(): Promise<AkSession> {
  if (cachedSession && Date.now() < cachedSession.expiresAt - 60_000) {
    return cachedSession;
  }

  const timestamp = new Date().toISOString();
  const headers = buildAkAuthHeaders(timestamp);

  const res = await fetch(
    `${OKX_API_BASE}/api/v5/waas/mpc/account/session-create`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        apiKey: env.OKX_API_KEY,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`akLogin failed: ${res.status} ${await res.text()}`);
  }

  const json: AkLoginResponse = await res.json();
  if (json.code !== "0") {
    throw new Error(`akLogin error ${json.code}`);
  }

  const sessionData = json.data[0];
  cachedSession = {
    accessToken: sessionData.accessToken,
    sessionCert: sessionData.sessionCert,
    encryptedSessionSk: sessionData.encryptedSessionSk,
    expiresAt: Date.now() + (sessionData.expiresIn ?? 3600) * 1000,
  };

  return cachedSession;
}

export async function getAccountBalance(
  accountId: string,
  chainIndex: string,
): Promise<AccountBalance[]> {
  const session = await akLogin();

  const res = await fetch(
    `${OKX_API_BASE}/api/v5/waas/asset/token-balances?accountId=${accountId}&chainIndex=${chainIndex}`,
    {
      headers: {
        "Content-Type": "application/json",
        "OK-ACCESS-KEY": env.OKX_API_KEY,
        "OK-ACCESS-PASSPHRASE": env.OKX_PASSPHRASE,
        Authorization: `Bearer ${session.accessToken}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(
      `getAccountBalance failed: ${res.status} ${await res.text()}`,
    );
  }

  const json: BalanceResponse = await res.json();
  if (json.code !== "0") {
    throw new Error(`getAccountBalance error ${json.code}`);
  }

  return json.data?.[0]?.tokenAssets ?? [];
}

export interface UnsignedTxInfo {
  unsignedHash: string;
  signType: string;
  encryptedPrivKey: string;
}

export async function preTransactionUnsignedInfo(params: {
  accountId: string;
  chainIndex: string;
  from: string;
  to: string;
  value: string;
  data: string;
  gas: string;
  gasPrice: string;
}): Promise<UnsignedTxInfo> {
  const session = await akLogin();

  const res = await fetch(
    `${OKX_API_BASE}/api/v5/waas/mpc/transaction/generate-unsigned-info`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "OK-ACCESS-KEY": env.OKX_API_KEY,
        "OK-ACCESS-PASSPHRASE": env.OKX_PASSPHRASE,
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(params),
    },
  );

  if (!res.ok) {
    throw new Error(
      `preTransactionUnsignedInfo failed: ${res.status} ${await res.text()}`,
    );
  }

  const json = await res.json();
  if (json.code !== "0") {
    throw new Error(`preTransactionUnsignedInfo error ${json.code}: ${json.msg}`);
  }

  return json.data[0] as UnsignedTxInfo;
}

export async function broadcastTransaction(params: {
  accountId: string;
  address: string;
  chainIndex: string;
  extraData: string;
}): Promise<string> {
  const session = await akLogin();

  const res = await fetch(
    `${OKX_API_BASE}/api/v5/waas/mpc/transaction/broadcast`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "OK-ACCESS-KEY": env.OKX_API_KEY,
        "OK-ACCESS-PASSPHRASE": env.OKX_PASSPHRASE,
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(params),
    },
  );

  if (!res.ok) {
    throw new Error(
      `broadcastTransaction failed: ${res.status} ${await res.text()}`,
    );
  }

  const json = await res.json();
  if (json.code !== "0") {
    throw new Error(`broadcastTransaction error ${json.code}: ${json.msg}`);
  }

  return json.data[0]?.txHash as string;
}
