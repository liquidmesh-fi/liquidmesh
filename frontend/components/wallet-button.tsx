"use client"

import { Wallet } from "lucide-react"
import { toast } from "sonner"
import {
	useChainId,
	useConnect,
	useConnectors,
	useDisconnect,
	useAccount,
	useSwitchChain,
} from "wagmi"
import { getOkxConnector, hasOkxWallet, XLAYER_CHAIN_ID } from "@/lib/okx-wallet"

function truncateAddress(address: string) {
	return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletButton() {
	const { address, isConnected, isConnecting, isReconnecting } = useAccount()
	const { connectAsync } = useConnect()
	const { disconnectAsync } = useDisconnect()
	const { switchChainAsync } = useSwitchChain()
	const chainId = useChainId()
	const connectors = useConnectors()

	const isLoading = isConnecting || isReconnecting

	async function handleConnect() {
		if (!hasOkxWallet()) {
			toast.error("OKX Wallet not detected", {
				description: "Install the OKX Wallet browser extension to connect.",
			})
			return
		}

		const okxConnector = getOkxConnector(connectors)
		if (!okxConnector) {
			toast.error("OKX Wallet connector unavailable")
			return
		}

		try {
			await connectAsync({ connector: okxConnector })
			if (chainId !== XLAYER_CHAIN_ID) {
				await switchChainAsync({ chainId: XLAYER_CHAIN_ID })
			}
		} catch {
			toast.error("Wallet connection cancelled")
		}
	}

	async function handleDisconnect() {
		try {
			await disconnectAsync()
		} catch {
			toast.error("Failed to disconnect")
		}
	}

	if (isLoading) {
		return <div className="h-8 w-28 rounded-lg bg-white/5 animate-pulse" />
	}

	if (isConnected && address) {
		return (
			<button
				type="button"
				onClick={handleDisconnect}
				className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all"
			>
				<span className="size-1.5 rounded-full bg-cyan-400" />
				{truncateAddress(address)}
			</button>
		)
	}

	return (
		<button
			type="button"
			onClick={handleConnect}
			className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
		>
			<Wallet className="size-3.5" />
			Connect Wallet
		</button>
	)
}
