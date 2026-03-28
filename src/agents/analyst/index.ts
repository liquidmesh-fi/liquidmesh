import OpenAI from "openai";
import { Agent, type AgentRunResult } from "../agent";
import { type EventBus, type SignalReadyPayload } from "../../comms/event-bus";
import type { AgentConfig } from "../../config/agents";
import { scanToken, isTokenSafe } from "../../services/onchainos/security";
import { getTokenPrice } from "../../services/onchainos/market";
import { settleX402 } from "../../services/onchainos/payments";
import { insertScore } from "../../memory/db";
import { env } from "../../env";
import { ANALYST_SYSTEM_PROMPT } from "../../system-prompts/analyst";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export class AnalystAgent extends Agent {
  private pendingSignal: SignalReadyPayload | null = null;

  constructor(config: AgentConfig, eventBus: EventBus) {
    super(config, eventBus);

    eventBus.on("signal:ready", (payload: SignalReadyPayload) => {
      this.pendingSignal = payload;
    });
  }

  async run(): Promise<AgentRunResult> {
    if (!this.pendingSignal) {
      this.log("No pending signal — waiting for Scout");
      return { success: true, message: "Waiting for signal" };
    }

    const signal = this.pendingSignal;
    this.pendingSignal = null;

    this.log(`Scoring ${signal.tokenSymbol} @ ${signal.tokenAddress}`);

    try {
      // Pay Scout's x402 endpoint to formally acquire the signal
      let signalData: Record<string, unknown> = {};
      try {
        const settled = await settleX402(
          `${env.PUBLIC_API_URL}/scout/signal`,
          this.config.walletAddress,
          this.config.accountId,
        );
        signalData = settled.body as Record<string, unknown>;
      } catch (err) {
        this.log("x402 signal payment skipped (endpoint not yet live)", { err: String(err) });
      }

      // Security scan
      const securityResult = await scanToken(signal.tokenAddress);
      this.log(`Security scan: riskLevel=${securityResult.riskLevel}, honeypot=${securityResult.isHoneypot}`);

      // Market data
      const priceData = await getTokenPrice(signal.tokenAddress);

      // Score via OpenAI
      const scoreResult = await this.scoreWithAI({
        signal,
        security: securityResult,
        price: priceData,
        signalData,
      });

      // Persist score
      const savedScore = await insertScore({
        signal_id: (signalData as { id?: string }).id ?? "unknown",
        token_address: signal.tokenAddress,
        score: scoreResult.score,
        recommendation: scoreResult.recommendation,
        reason: scoreResult.reason,
        risk_factors: securityResult.riskItems.map((r) => r.title),
      });

      // Emit internal event
      this.eventBus.emit("score:ready", {
        tokenAddress: signal.tokenAddress,
        score: scoreResult.score,
        recommendation: scoreResult.recommendation,
        reason: scoreResult.reason,
      });

      this.log(`Score: ${scoreResult.score} → ${scoreResult.recommendation}`);

      return {
        success: true,
        message: `Scored ${signal.tokenSymbol}: ${scoreResult.score}/100`,
        data: { scoreId: savedScore.id, score: scoreResult.score, recommendation: scoreResult.recommendation },
      };
    } catch (err) {
      this.logError("Scoring failed", err);
      this.eventBus.emit("agent:error", {
        agentName: this.name,
        error: String(err),
      });
      return { success: false, message: `Analyst error: ${String(err)}` };
    }
  }

  private async scoreWithAI(context: {
    signal: SignalReadyPayload;
    security: { riskLevel: string; isHoneypot: boolean; riskItems: Array<{ title: string }> };
    price: { price: string; priceChange24h: string } | null;
    signalData: Record<string, unknown>;
  }): Promise<{ score: number; recommendation: "execute" | "skip"; reason: string }> {
    // Hard gate: honeypot is always 0
    if (context.security.isHoneypot) {
      return { score: 0, recommendation: "skip", reason: "Honeypot detected" };
    }

    const prompt = `Evaluate this LiquidMesh trade signal and respond with JSON only.

IMPORTANT CONTEXT: LiquidMesh always executes OKB→USDG swaps on X Layer regardless of which token triggered the signal.
The signal token below is what smart money is buying — it indicates X Layer ecosystem activity.
The actual trade risk is OKB→USDG (native token → stablecoin), which is inherently low risk.
Score the opportunity based on: signal strength, ecosystem momentum, and market conditions.
Honeypot is an auto-skip. Otherwise, score based on signal strength and market context.

Signal token: ${context.signal.tokenSymbol} (${context.signal.tokenAddress})
Signal strength (USD volume): $${context.signal.signalStrength.toFixed(2)}
Signal token security: ${context.security.riskLevel} risk${context.security.isHoneypot ? " — HONEYPOT" : ""}
Actual trade: OKB → USDG (stablecoin hedge on X Layer)
OKB price: ${context.price?.price ?? "unknown"}
24h price change: ${context.price?.priceChange24h ?? "unknown"}

Respond with exactly this JSON:
{
  "score": <0-100>,
  "recommendation": "execute" | "skip",
  "reason": "<one sentence>"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: ANALYST_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as {
      score?: number;
      recommendation?: string;
      reason?: string;
    };

    const score = Math.min(100, Math.max(0, parsed.score ?? 0));
    const recommendation = score >= 50 ? "execute" : "skip";

    return {
      score,
      recommendation: (parsed.recommendation as "execute" | "skip") ?? recommendation,
      reason: parsed.reason ?? "AI evaluation complete",
    };
  }
}
