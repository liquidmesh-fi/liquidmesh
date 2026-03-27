import { Hono } from "hono";
import {
  startMesh,
  stopMesh,
  getMeshStatus,
  getRegistry,
} from "../agents/index";
import {
  getRecentTrades,
  getRecentSignals,
  getRecentPayments,
  getTradeSummary,
} from "../memory/db";
import type { ApiResponse } from "../types";

export const meshRouter = new Hono();

meshRouter.get("/status", (c) => {
  const status = getMeshStatus();
  return c.json<ApiResponse<typeof status>>({ success: true, data: status });
});

meshRouter.post("/start", async (c) => {
  try {
    await startMesh();
    return c.json<ApiResponse<{ started: true }>>({
      success: true,
      data: { started: true },
    });
  } catch (err) {
    return c.json<ApiResponse<never>>(
      { success: false, error: String(err) },
      500,
    );
  }
});

meshRouter.post("/stop", (c) => {
  stopMesh();
  return c.json<ApiResponse<{ stopped: true }>>({
    success: true,
    data: { stopped: true },
  });
});

meshRouter.get("/trades", async (c) => {
  const limit = Number(c.req.query("limit") ?? "20");
  const trades = await getRecentTrades(limit);
  return c.json<ApiResponse<typeof trades>>({ success: true, data: trades });
});

meshRouter.get("/signals", async (c) => {
  const limit = Number(c.req.query("limit") ?? "10");
  const signals = await getRecentSignals(limit);
  return c.json<ApiResponse<typeof signals>>({ success: true, data: signals });
});

meshRouter.get("/payments", async (c) => {
  const payments = await getRecentPayments(20);
  return c.json<ApiResponse<typeof payments>>({ success: true, data: payments });
});

meshRouter.get("/summary", async (c) => {
  const summary = await getTradeSummary();
  const status = getMeshStatus();

  const registry = getRegistry();
  const orchestratorAgent = registry?.orchestrator;

  return c.json<ApiResponse<typeof summary & { mesh: typeof status }>>({
    success: true,
    data: { ...summary, mesh: status },
  });
});

meshRouter.post("/tick", async (c) => {
  const registry = getRegistry();
  if (!registry) {
    return c.json<ApiResponse<never>>(
      { success: false, error: "Agents not initialized" },
      503,
    );
  }

  // Trigger a single cycle on all agents (for demo/testing)
  const results = await Promise.allSettled([
    registry.scout.runOnce(),
    registry.analyst.runOnce(),
    registry.executor.runOnce(),
    registry.orchestrator.runOnce(),
  ]);

  return c.json<ApiResponse<typeof results>>({ success: true, data: results });
});
