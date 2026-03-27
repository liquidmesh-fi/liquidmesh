import { env } from "../env";

export interface AgentConfig {
  name: string;
  role: string;
  accountId: string;
  walletAddress: string;
}

export function getAgentConfigs(): Record<string, AgentConfig> {
  return {
    scout: {
      name: "Scout",
      role: "Signal detection and market scanning",
      accountId: env.SCOUT_ACCOUNT_ID,
      walletAddress: env.SCOUT_WALLET_ADDRESS,
    },
    analyst: {
      name: "Analyst",
      role: "Risk scoring and trade recommendation",
      accountId: env.ANALYST_ACCOUNT_ID,
      walletAddress: env.ANALYST_WALLET_ADDRESS,
    },
    executor: {
      name: "Executor",
      role: "Swap execution and transaction management",
      accountId: env.EXECUTOR_ACCOUNT_ID,
      walletAddress: env.EXECUTOR_WALLET_ADDRESS,
    },
    orchestrator: {
      name: "Orchestrator",
      role: "Budget management and mesh coordination",
      accountId: env.ORCHESTRATOR_ACCOUNT_ID,
      walletAddress: env.ORCHESTRATOR_WALLET_ADDRESS,
    },
  };
}
