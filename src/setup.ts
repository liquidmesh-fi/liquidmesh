import { eventBus } from "./comms/event-bus";
import { registerAgents, startMesh } from "./agents/index";
import { env } from "./env";

export async function setup(): Promise<void> {
  console.log("[Setup] Initializing LiquidMesh...");

  registerAgents(eventBus);
  console.log("[Setup] Agents registered: Scout, Analyst, Executor, Orchestrator");

  if (env.ENABLE_AGENTS) {
    console.log("[Setup] ENABLE_AGENTS=true — starting mesh...");
    await startMesh();
    console.log("[Setup] Mesh started");
  } else {
    console.log("[Setup] ENABLE_AGENTS=false — mesh ready but not started");
  }
}
