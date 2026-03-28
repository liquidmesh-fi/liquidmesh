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
  getRecentScores,
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

meshRouter.get("/scores", async (c) => {
  const limit = Number(c.req.query("limit") ?? "10");
  const scores = await getRecentScores(limit);
  return c.json<ApiResponse<typeof scores>>({ success: true, data: scores });
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

  // Run agents sequentially so Scout's signal:ready event is picked up by Analyst,
  // and Analyst's score:ready is picked up by Executor in the same tick.
  const results = [];
  results.push({ status: "fulfilled", value: await registry.scout.runOnce() });
  // Small delay to let EventBus listeners fire between steps
  await new Promise((r) => setTimeout(r, 200));
  results.push({ status: "fulfilled", value: await registry.analyst.runOnce() });
  await new Promise((r) => setTimeout(r, 200));
  results.push({ status: "fulfilled", value: await registry.executor.runOnce() });
  await new Promise((r) => setTimeout(r, 200));
  results.push({ status: "fulfilled", value: await registry.orchestrator.runOnce() });

  return c.json<ApiResponse<typeof results>>({ success: true, data: results });
});
