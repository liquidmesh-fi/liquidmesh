import { Agent, type AgentRunResult } from "../agent";
import { type EventBus, type TradeDonePayload, type BudgetAlertPayload, type AgentErrorPayload } from "../../comms/event-bus";
import type { AgentConfig } from "../../config/agents";
import { getTradeSummary, insertMetric } from "../../memory/db";

interface SessionMetrics {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalOkbSpent: number;
  totalUsdgOnX402: number;
  lastTradeAt: string | null;
}

export class OrchestratorAgent extends Agent {
  private sessionMetrics: SessionMetrics = {
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    totalOkbSpent: 0,
    totalUsdgOnX402: 0,
    lastTradeAt: null,
  };

  constructor(config: AgentConfig, eventBus: EventBus) {
    super(config, eventBus);

    eventBus.on("trade:done", (payload: TradeDonePayload) => {
      this.onTradeDone(payload);
    });

    eventBus.on("budget:alert", (payload: BudgetAlertPayload) => {
      this.log(`BUDGET ALERT from ${payload.agentName}: spent ${payload.spent}, limit ${payload.limit}`);
    });

    eventBus.on("agent:error", (payload: AgentErrorPayload) => {
      this.log(`Agent error from ${payload.agentName}: ${payload.error}`);
    });
  }

  async run(): Promise<AgentRunResult> {
    this.log("Running metrics aggregation...");

    try {
      const summary = await getTradeSummary();

      await insertMetric({
        agent_name: "orchestrator",
        metric_type: "trade_summary",
        value: summary.total,
        metadata: {
          success: summary.success,
          failed: summary.failed,
          totalOkbSpent: summary.totalOkbSpent,
          sessionOkbSpent: this.sessionMetrics.totalOkbSpent,
          sessionUsdgOnX402: this.sessionMetrics.totalUsdgOnX402,
        },
      });

      // Budget alert: log if session spending is notable
      if (this.sessionMetrics.totalOkbSpent > 0.05) {
        this.log(`Budget note: session OKB spent = ${this.sessionMetrics.totalOkbSpent.toFixed(4)} OKB`);
        this.eventBus.emit("budget:alert", {
          agentName: "executor",
          spent: this.sessionMetrics.totalOkbSpent,
          limit: 0.1,
        });
      }

      this.log(`Metrics: ${summary.total} total trades, ${summary.success} success, OKB spent: ${summary.totalOkbSpent}`);

      return {
        success: true,
        message: "Metrics aggregated",
        data: { ...summary, session: this.sessionMetrics },
      };
    } catch (err) {
      this.logError("Metrics aggregation failed", err);
      return { success: false, message: `Orchestrator error: ${String(err)}` };
    }
  }

  getSessionMetrics(): SessionMetrics {
    return { ...this.sessionMetrics };
  }

  private onTradeDone(payload: TradeDonePayload): void {
    this.sessionMetrics.totalTrades++;
    this.sessionMetrics.lastTradeAt = new Date().toISOString();

    if (payload.success) {
      this.sessionMetrics.successfulTrades++;
      this.sessionMetrics.totalOkbSpent += parseFloat(payload.amountOkb);
    } else {
      this.sessionMetrics.failedTrades++;
    }

    this.log(
      `Trade recorded: ${payload.success ? "✓" : "✗"} ${payload.tokenSymbol} | txHash: ${payload.txHash || "none"}`,
    );
  }
}
