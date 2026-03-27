import { env } from "../../env";
import { OKX_API_BASE } from "../../config/chains";

function generateSignature(
  timestamp: string,
  method: string,
  path: string,
  body: string,
): string {
  const prehash = `${timestamp}${method.toUpperCase()}${path}${body}`;
  const encoder = new TextEncoder();
  const key = encoder.encode(env.OKX_SECRET_KEY);
  const msg = encoder.encode(prehash);

  // Use Bun's native HMAC
  const hmac = new Bun.CryptoHasher("sha256", key);
  hmac.update(msg);
  const digest = hmac.digest();
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

interface OkxFetchOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

export async function okxFetch<T>(
  path: string,
  options: OkxFetchOptions = {},
): Promise<T> {
  const { method = "GET", body, params } = options;

  let fullPath = path;
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(params).toString();
    fullPath = `${path}?${qs}`;
  }

  const timestamp = new Date().toISOString();
  const bodyStr = body ? JSON.stringify(body) : "";
  const signature = generateSignature(timestamp, method, fullPath, bodyStr);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "OK-ACCESS-KEY": env.OKX_API_KEY,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": env.OKX_PASSPHRASE,
  };

  const url = `${OKX_API_BASE}${fullPath}`;
  const res = await fetch(url, {
    method,
    headers,
    body: bodyStr || undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OKX API ${method} ${path} → ${res.status}: ${text}`);
  }

  const json = await res.json();

  if (json.code && json.code !== "0" && json.code !== 0) {
    throw new Error(`OKX API error ${json.code}: ${json.msg}`);
  }

  return json as T;
}

export async function okxFetchPaged<T>(
  path: string,
  options: OkxFetchOptions = {},
): Promise<T[]> {
  const result = await okxFetch<{ data: T[] }>(path, options);
  return result.data ?? [];
}
