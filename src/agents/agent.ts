import type { EventBus } from "../comms/event-bus";
import type { AgentConfig } from "../config/agents";

export interface AgentRunResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export abstract class Agent {
  readonly name: string;
  readonly config: AgentConfig;
  protected eventBus: EventBus;

  constructor(config: AgentConfig, eventBus: EventBus) {
    this.name = config.name;
    this.config = config;
    this.eventBus = eventBus;
  }

  /** Called once per mesh tick. Agents do their work here. */
  abstract run(): Promise<AgentRunResult>;

  protected log(message: string, data?: Record<string, unknown>): void {
    const ts = new Date().toISOString();
    if (data) {
      console.log(`[${ts}] [${this.name}] ${message}`, data);
    } else {
      console.log(`[${ts}] [${this.name}] ${message}`);
    }
  }

  protected logError(message: string, error?: unknown): void {
    const ts = new Date().toISOString();
    console.error(`[${ts}] [${this.name}] ERROR: ${message}`, error ?? "");
  }
}
