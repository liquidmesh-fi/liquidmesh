import { env } from "../env";
import type { Agent, AgentRunResult } from "./agent";
import type { AgentStatus } from "../types";

interface AgentManagerState {
  isRunning: boolean;
  cycleCount: number;
  lastActivity: string | null;
  nextCheckAt: number | null;
  timeoutHandle: ReturnType<typeof setTimeout> | null;
}

export class AgentManager {
  private agent: Agent;
  private state: AgentManagerState = {
    isRunning: false,
    cycleCount: 0,
    lastActivity: null,
    nextCheckAt: null,
    timeoutHandle: null,
  };

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async start(): Promise<void> {
    if (this.state.isRunning) return;
    this.state.isRunning = true;
    await this.runCycle();
  }

  stop(): void {
    this.state.isRunning = false;
    if (this.state.timeoutHandle) {
      clearTimeout(this.state.timeoutHandle);
      this.state.timeoutHandle = null;
    }
    this.state.nextCheckAt = null;
  }

  getStatus(): AgentStatus {
    return {
      name: this.agent.name,
      isRunning: this.state.isRunning,
      cycleCount: this.state.cycleCount,
      lastActivity: this.state.lastActivity,
      nextCheckIn: this.state.nextCheckAt
        ? Math.max(0, this.state.nextCheckAt - Date.now())
        : null,
      walletAddress: this.agent.config.walletAddress,
    };
  }

  private async runCycle(): Promise<void> {
    if (!this.state.isRunning) return;

    try {
      const result = await this.agent.run();
      this.state.cycleCount++;
      this.state.lastActivity = new Date().toISOString();

      if (!result.success) {
        console.warn(
          `[AgentManager] [${this.agent.name}] cycle failed: ${result.message}`,
        );
      }
    } catch (err) {
      console.error(`[AgentManager] [${this.agent.name}] uncaught error:`, err);
    }

    if (this.state.isRunning) {
      this.scheduleNext();
    }
  }

  async runOnce(): Promise<AgentRunResult> {
    return this.agent.run();
  }

  private scheduleNext(): void {
    const intervalMs = env.CHECK_INTERVAL_MINUTES * 60 * 1000;
    this.state.nextCheckAt = Date.now() + intervalMs;
    this.state.timeoutHandle = setTimeout(() => this.runCycle(), intervalMs);
  }
}
