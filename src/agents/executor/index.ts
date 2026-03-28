import { Agent, type AgentRunResult } from "../agent";
import { type EventBus, type ScoreReadyPayload } from "../../comms/event-bus";
import type { AgentConfig } from "../../config/agents";
import { getSwapQuote, buildSwapTransaction } from "../../services/onchainos/swap";
import {
  preTransactionUnsignedInfo,
  broadcastAgenticTransaction,
} from "../../services/onchainos/agentic-wallet";
import { settleX402 } from "../../services/onchainos/payments";
import { insertTrade } from "../../memory/db";
import { env } from "../../env";
import { OKB_NATIVE, XLAYER_USDC, XLAYER_CHAIN_INDEX } from "../../config/chains";

function toWei(amount: string): string {
  const val = parseFloat(amount);
  return BigInt(Math.floor(val * 1e18)).toString();
}

export class ExecutorAgent extends Agent {
  private pendingScore: ScoreReadyPayload | null = null;

  constructor(config: AgentConfig, eventBus: EventBus) {
    super(config, eventBus);

    eventBus.on("score:ready", (payload: ScoreReadyPayload) => {
      this.pendingScore = payload;
    });
  }

  async run(): Promise<AgentRunResult> {
    if (!this.pendingScore) {
      this.log("No pending score — waiting for Analyst");
      return { success: true, message: "Waiting for score" };
    }

    const score = this.pendingScore;
    this.pendingScore = null;

    if (score.recommendation !== "execute") {
      this.log(`Score ${score.score} → skip (${score.reason})`);
      return { success: true, message: `Skipped: ${score.reason}` };
    }

    this.log(`Executing swap for ${score.tokenAddress} (score: ${score.score})`);

    let scoreData: Record<string, unknown> = {};
    try {
      const settled = await settleX402(
        `${env.PUBLIC_API_URL}/analyst/score`,
        this.config.walletAddress,
        this.config.accountId,
      );
      scoreData = settled.body as Record<string, unknown>;
    } catch (err) {
      this.log("x402 score payment skipped", { err: String(err) });
    }

    const swapAmountOkb = env.EXECUTOR_SWAP_AMOUNT_OKB;
    const swapAmountWei = toWei(swapAmountOkb);

    const trade = await insertTrade({
      score_id: (scoreData as { id?: string }).id ?? "unknown",
      token_address: score.tokenAddress,
      token_symbol: score.tokenAddress.slice(0, 8),
      amount_okb: swapAmountOkb,
      tx_hash: null,
      status: "pending",
      error: null,
    });

    try {
      const quote = await getSwapQuote(swapAmountWei, OKB_NATIVE, XLAYER_USDC);
      this.log(`Swap quote: ${swapAmountOkb} OKB → ${quote.toTokenAmount} USDC, impact: ${quote.priceImpact}%`);

      if (parseFloat(quote.priceImpact ?? "0") > 5) {
        throw new Error(`Price impact too high: ${quote.priceImpact}%`);
      }

      const swapTx = await buildSwapTransaction(
        swapAmountWei,
        this.config.walletAddress,
        OKB_NATIVE,
        XLAYER_USDC,
        "0.5",
      );

      this.log(`Swap tx: to=${swapTx.to} value=${swapTx.value} gas=${swapTx.gas}`);

      const unsignedInfo = await preTransactionUnsignedInfo({
        accountId: this.config.accountId,
        chainIndex: Number(XLAYER_CHAIN_INDEX),
        fromAddr: swapTx.from,
        toAddr: swapTx.to,
        value: swapAmountWei,
        inputData: swapTx.data,
      });

      if (!unsignedInfo.executeResult) {
        throw new Error(`Pre-transaction failed: ${unsignedInfo.executeErrorMsg}`);
      }

      const broadcastResult = await broadcastAgenticTransaction({
        accountId: this.config.accountId,
        address: swapTx.from,
        chainIndex: XLAYER_CHAIN_INDEX,
        extraData: JSON.stringify(unsignedInfo.extraData),
      });

      const txHash = broadcastResult.txHash || broadcastResult.orderId;
      this.log(`Swap broadcast: ${txHash}`);

      const { updateTrade } = await import("../../memory/db");
      await updateTrade(trade.id!, { tx_hash: txHash, status: "success", token_symbol: "USDC" });

      this.eventBus.emit("trade:done", {
        tokenAddress: score.tokenAddress,
        tokenSymbol: "USDC",
        amountOkb: swapAmountOkb,
        txHash,
        success: true,
      });

      this.log(`Trade executed: ${txHash}`);

      return {
        success: true,
        message: `Swap executed: ${swapAmountOkb} OKB → USDC`,
        data: { txHash, score: score.score },
      };
    } catch (err) {
      const errorMsg = String(err);
      this.logError("Swap execution failed", err);

      const { updateTrade } = await import("../../memory/db");
      await updateTrade(trade.id!, { status: "failed", error: errorMsg });

      this.eventBus.emit("trade:done", {
        tokenAddress: score.tokenAddress,
        tokenSymbol: "UNKNOWN",
        amountOkb: swapAmountOkb,
        txHash: "",
        success: false,
      });

      this.eventBus.emit("agent:error", { agentName: this.name, error: errorMsg });

      return { success: false, message: `Executor error: ${errorMsg}` };
    }
  }
}
