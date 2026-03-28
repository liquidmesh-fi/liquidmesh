"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { defineChain } from "viem";
import { createConfig, http, injected, WagmiProvider } from "wagmi";

const xlayer = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech"] },
    fallback: { http: ["https://xlayerrpc.okx.com"] },
  },
  blockExplorers: {
    default: { name: "OKLink", url: "https://www.oklink.com/xlayer" },
  },
});

const wagmiConfig = createConfig({
  chains: [xlayer],
  connectors: [
    injected({
      target: {
        id: "okx",
        name: "OKX Wallet",
        provider: () =>
          typeof window !== "undefined" ? window.okxwallet : undefined,
      },
    }),
  ],
  transports: {
    [xlayer.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            refetchInterval: 5_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
