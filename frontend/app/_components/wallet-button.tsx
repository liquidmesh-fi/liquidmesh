"use client";

import { toast } from "sonner";
import {
  useChainId,
  useConnect,
  useConnectors,
  useDisconnect,
  useAccount,
  useSwitchChain,
} from "wagmi";
import { getOkxConnector, hasOkxWallet, XLAYER_CHAIN_ID } from "../../lib/okx-wallet";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const chainId = useChainId();
  const connectors = useConnectors();

  const isLoading = isConnecting || isReconnecting;

  async function handleConnect() {
    if (!hasOkxWallet()) {
      toast.error("OKX Wallet not detected", {
        description: "Install the OKX Wallet browser extension to connect.",
      });
      return;
    }

    const okxConnector = getOkxConnector(connectors);
    if (!okxConnector) {
      toast.error("OKX Wallet connector unavailable");
      return;
    }

    try {
      await connectAsync({ connector: okxConnector });
      if (chainId !== XLAYER_CHAIN_ID) {
        await switchChainAsync({ chainId: XLAYER_CHAIN_ID });
      }
    } catch {
      toast.error("Wallet connection cancelled");
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectAsync();
    } catch {
      toast.error("Failed to disconnect");
    }
  }

  if (isLoading) {
    return (
      <div className="h-8 w-28 rounded-lg bg-white/5 animate-pulse" />
    );
  }

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={handleDisconnect}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all"
      >
        <span className="size-1.5 rounded-full bg-emerald-400" />
        {truncateAddress(address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
    >
      <svg
        className="size-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      Connect OKX Wallet
    </button>
  );
}
