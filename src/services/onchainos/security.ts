import { okxFetch } from "./client";
import { XLAYER_CHAIN_INDEX } from "../../config/chains";
import type { OkxTokenScanResult } from "../../types";

interface SecurityScanResponse {
  code: string;
  msg: string;
  data: Array<{
    chainId: string;
    contractAddress: string;
    riskLevel?: string;
    isHoneypot?: boolean | string;
    holders?: number;
    riskItems?: Array<{ title: string; desc: string }>;
  }>;
}

/**
 * Scan a token contract for security risks.
 * Returns structured risk assessment.
 */
export async function scanToken(
  tokenAddress: string,
): Promise<OkxTokenScanResult> {
  const response = await okxFetch<SecurityScanResponse>(
    "/api/v6/security/token-scan",
    {
      method: "POST",
      body: {
        source: "1",
        tokenList: [
          {
            chainId: XLAYER_CHAIN_INDEX,
            contractAddress: tokenAddress,
          },
        ],
      },
    },
  );

  const raw = response.data?.[0];
  if (!raw) {
    return {
      chainId: XLAYER_CHAIN_INDEX,
      contractAddress: tokenAddress,
      riskLevel: "high",
      isHoneypot: true,
      riskItems: [{ title: "Scan failed", desc: "No data returned from security scan" }],
    };
  }

  const riskLevel = normalizeRiskLevel(raw.riskLevel);
  const isHoneypot =
    raw.isHoneypot === true ||
    raw.isHoneypot === "true" ||
    raw.isHoneypot === "1";

  return {
    chainId: raw.chainId ?? XLAYER_CHAIN_INDEX,
    contractAddress: raw.contractAddress ?? tokenAddress,
    riskLevel,
    isHoneypot,
    holders: raw.holders,
    riskItems: raw.riskItems ?? [],
  };
}

function normalizeRiskLevel(
  raw?: string,
): "low" | "medium" | "high" {
  switch (raw?.toLowerCase()) {
    case "0":
    case "low":
      return "low";
    case "1":
    case "medium":
    case "moderate":
      return "medium";
    default:
      return "high";
  }
}

export function isTokenSafe(result: OkxTokenScanResult): boolean {
  return result.riskLevel !== "high" && !result.isHoneypot;
}
