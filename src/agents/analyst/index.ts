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

    const prompt = `Evaluate this trade opportunity and respond with JSON only.

Token: ${context.signal.tokenSymbol} (${context.signal.tokenAddress})
Signal strength: ${context.signal.signalStrength}
Security risk level: ${context.security.riskLevel}
Risk items: ${context.security.riskItems.map((r) => r.title).join(", ") || "none"}
Price: ${context.price?.price ?? "unknown"}
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
