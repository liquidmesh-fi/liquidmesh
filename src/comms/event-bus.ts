import { EventEmitter } from "node:events";

export type LiquidMeshEvent =
  | "mesh:tick"
  | "signal:ready"
  | "score:ready"
  | "trade:done"
  | "budget:alert"
  | "agent:error";

export interface SignalReadyPayload {
  tokenAddress: string;
  chainIndex: string;
  signalStrength: number;
  tokenSymbol: string;
}

export interface ScoreReadyPayload {
  tokenAddress: string;
  score: number;
  recommendation: "execute" | "skip";
  reason: string;
}

export interface TradeDonePayload {
  tokenAddress: string;
  tokenSymbol: string;
  amountOkb: string;
  txHash: string;
  success: boolean;
}

export interface BudgetAlertPayload {
  agentName: string;
  spent: number;
  limit: number;
}

export interface AgentErrorPayload {
  agentName: string;
  error: string;
}

type EventPayloadMap = {
  "mesh:tick": void;
  "signal:ready": SignalReadyPayload;
  "score:ready": ScoreReadyPayload;
  "trade:done": TradeDonePayload;
  "budget:alert": BudgetAlertPayload;
  "agent:error": AgentErrorPayload;
};

export class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(20);
  }

  emit<E extends LiquidMeshEvent>(
    event: E,
    payload: EventPayloadMap[E],
  ): void {
    this.emitter.emit(event, payload);
  }

  on<E extends LiquidMeshEvent>(
    event: E,
    handler: (payload: EventPayloadMap[E]) => void,
  ): void {
    this.emitter.on(event, handler);
  }

  off<E extends LiquidMeshEvent>(
    event: E,
    handler: (payload: EventPayloadMap[E]) => void,
  ): void {
    this.emitter.off(event, handler);
  }

  once<E extends LiquidMeshEvent>(
    event: E,
    handler: (payload: EventPayloadMap[E]) => void,
  ): void {
    this.emitter.once(event, handler);
  }
}

export const eventBus = new EventBus();
