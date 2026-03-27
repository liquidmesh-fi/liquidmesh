import { Agent, type AgentRunResult } from "../agent";
import type { EventBus } from "../../comms/event-bus";
import type { AgentConfig } from "../../config/agents";
import { getTopSignal } from "../../services/onchainos/signal";
import { getTopHotToken } from "../../services/onchainos/token";
import { insertSignal } from "../../memory/db";
import { XLAYER_CHAIN_INDEX } from "../../config/chains";

export class ScoutAgent extends Agent {
  constructor(config: AgentConfig, eventBus: EventBus) {
    super(config, eventBus);
  }

  async run(): Promise<AgentRunResult> {
    this.log("Starting signal scan...");

    try {
      // Try primary: smart money signals
      let tokenAddress: string | null = null;
      let tokenSymbol = "UNKNOWN";
      let signalStrength = 0;
      let rawData: Record<string, unknown> = {};

      const signal = await getTopSignal();

      if (signal) {
        this.log(`Signal found: ${signal.tokenSymbol} (strength: ${signal.signalStrength})`);
        tokenAddress = signal.tokenAddress;
        tokenSymbol = signal.tokenSymbol;
        signalStrength = signal.signalStrength;
        rawData = signal.rawData as unknown as Record<string, unknown>;
      } else {
        // Fallback: trending tokens
        this.log("No signals — falling back to trending tokens");
        const hotToken = await getTopHotToken();

        if (!hotToken) {
          return { success: false, message: "No signals and no hot tokens found" };
        }

        this.log(`Hot token fallback: ${hotToken.tokenSymbol}`);
        tokenAddress = hotToken.tokenContractAddress;
        tokenSymbol = hotToken.tokenSymbol;
        signalStrength = 0;
        rawData = { source: "hot-token", priceChange24h: hotToken.change, volume: hotToken.volume };
      }

      if (!tokenAddress) {
        return { success: false, message: "No valid token address resolved" };
      }

      // Persist signal
      const savedSignal = await insertSignal({
        token_address: tokenAddress,
        token_symbol: tokenSymbol,
        chain_index: XLAYER_CHAIN_INDEX,
        signal_strength: signalStrength,
        raw_data: rawData,
      });

      // Emit internal event
      this.eventBus.emit("signal:ready", {
        tokenAddress,
        chainIndex: XLAYER_CHAIN_INDEX,
        signalStrength,
        tokenSymbol,
      });

      this.log(`Signal persisted and emitted: ${tokenSymbol} @ ${tokenAddress}`);

      return {
        success: true,
        message: `Signal detected: ${tokenSymbol}`,
        data: { signalId: savedSignal.id, tokenAddress, tokenSymbol, signalStrength },
      };
    } catch (err) {
      this.logError("Signal scan failed", err);
      this.eventBus.emit("agent:error", {
        agentName: this.name,
        error: String(err),
      });
      return { success: false, message: `Scout error: ${String(err)}` };
    }
  }
}
