import type { EventBus } from "../comms/event-bus";
import { getAgentConfigs } from "../config/agents";
import { AgentManager } from "./agent-manager";
import { ScoutAgent } from "./scout";
import { AnalystAgent } from "./analyst";
import { ExecutorAgent } from "./executor";
import { OrchestratorAgent } from "./orchestrator";
import type { MeshStatus } from "../types";

export interface AgentRegistry {
  scout: AgentManager;
  analyst: AgentManager;
  executor: AgentManager;
  orchestrator: AgentManager;
}

let registry: AgentRegistry | null = null;

export function registerAgents(eventBus: EventBus): AgentRegistry {
  const configs = getAgentConfigs();

  const scout = new ScoutAgent(configs.scout, eventBus);
  const analyst = new AnalystAgent(configs.analyst, eventBus);
  const executor = new ExecutorAgent(configs.executor, eventBus);
  const orchestrator = new OrchestratorAgent(configs.orchestrator, eventBus);

  registry = {
    scout: new AgentManager(scout),
    analyst: new AgentManager(analyst),
    executor: new AgentManager(executor),
    orchestrator: new AgentManager(orchestrator),
  };

  return registry;
}

export function getRegistry(): AgentRegistry | null {
  return registry;
}

export async function startMesh(): Promise<void> {
  if (!registry) throw new Error("Agents not registered. Call registerAgents() first.");
  await Promise.all([
    registry.scout.start(),
    registry.analyst.start(),
    registry.executor.start(),
    registry.orchestrator.start(),
  ]);
}

export function stopMesh(): void {
  if (!registry) return;
  registry.scout.stop();
  registry.analyst.stop();
  registry.executor.stop();
  registry.orchestrator.stop();
}

export function getMeshStatus(): MeshStatus {
  if (!registry) {
    return { isRunning: false, agents: [], startedAt: null };
  }

  const statuses = [
    registry.scout.getStatus(),
    registry.analyst.getStatus(),
    registry.executor.getStatus(),
    registry.orchestrator.getStatus(),
  ];

  const anyRunning = statuses.some((s) => s.isRunning);

  return {
    isRunning: anyRunning,
    agents: statuses,
    startedAt: anyRunning ? new Date().toISOString() : null,
  };
}
