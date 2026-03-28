import { Agent, type AgentRunResult } from "../agent";
import { type EventBus, type ScoreReadyPayload } from "../../comms/event-bus";
import type { AgentConfig } from "../../config/agents";
import { getSwapQuote, buildSwapTransaction } from "../../services/onchainos/swap";
import { settleX402 } from "../../services/onchainos/payments";
import { insertTrade } from "../../memory/db";
import { env } from "../../env";
import { OKB_NATIVE, XLAYER_USDC, XLAYER_CHAIN_INDEX } from "../../config/chains";

// OKB has 18 decimals — convert human-readable to wei
function toWei(amount: string): string {
  const val = parseFloat(amount);
  return BigInt(Math.floor(val * 1e18)).toString();
}

async function runOnchainos(args: string[]): Promise<{ ok: boolean; txHash?: string; error?: string }> {
  const proc = Bun.spawn(["onchainos", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  await proc.exited;

  const output = stdout.trim() || stderr.trim();
  try {
    const parsed = JSON.parse(output) as { ok: boolean; data?: { txHash?: string }; error?: string };
    if (parsed.ok && parsed.data?.txHash) {
      return { ok: true, txHash: parsed.data.txHash };
    }
    return { ok: false, error: parsed.error ?? output };
  } catch {
    return { ok: false, error: output };
  }
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

    // Pay Analyst's x402 endpoint to formally acquire the score
    let scoreData: Record<string, unknown> = {};
    try {
      const settled = await settleX402(
        `${env.PUBLIC_API_URL}/analyst/score`,
        this.config.walletAddress,
        this.config.accountId,
      );
      scoreData = settled.body as Record<string, unknown>;
    } catch (err) {
      this.log("x402 score payment skipped (endpoint not yet live)", { err: String(err) });
    }

    const swapAmountOkb = env.EXECUTOR_SWAP_AMOUNT_OKB;
    const swapAmountWei = toWei(swapAmountOkb);

    // Insert trade record before execution
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
      // Get swap quote (OKB → USDC — direct route works with X Layer AA wallet)
      const quote = await getSwapQuote(swapAmountWei, OKB_NATIVE, XLAYER_USDC);
      this.log(`Swap quote: ${swapAmountOkb} OKB → ${quote.toTokenAmount} USDC, impact: ${quote.priceImpact}%`);

      const priceImpact = parseFloat(quote.priceImpact ?? "0");
      if (priceImpact > 5) {
        throw new Error(`Price impact too high: ${priceImpact}%`);
      }

      // Build swap transaction calldata
      const swapTx = await buildSwapTransaction(
        swapAmountWei,
        this.config.walletAddress,
        OKB_NATIVE,
        XLAYER_USDC,
        "0.5",
      );

      this.log("Signing via onchainos CLI TEE and broadcasting");

      // Switch CLI to executor account and execute swap
      await runOnchainos(["wallet", "switch", this.config.accountId]);

      const result = await runOnchainos([
        "wallet", "contract-call",
        "--to", swapTx.to,
        "--chain", XLAYER_CHAIN_INDEX,
        "--amt", swapAmountWei,
        "--input-data", swapTx.data,
        "--from", swapTx.from,
      ]);

      if (!result.ok || !result.txHash) {
        throw new Error(`Swap execution failed: ${result.error}`);
      }

      const txHash = result.txHash;
      this.log(`Swap broadcast: ${txHash}`);

      const { updateTrade } = await import("../../memory/db");
      await updateTrade(trade.id!, {
        tx_hash: txHash,
        status: "success",
        token_symbol: "USDC",
      });

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

      this.eventBus.emit("agent:error", {
        agentName: this.name,
        error: errorMsg,
      });

      return { success: false, message: `Executor error: ${errorMsg}` };
    }
  }
}
