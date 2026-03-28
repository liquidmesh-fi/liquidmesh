import { Hono } from "hono";
import {
  startMesh,
  stopMesh,
  getMeshStatus,
  getRegistry,
} from "../agents/index";
import { getAllBalances } from "../services/onchainos/portfolio";
import { getAgentConfigs } from "../config/agents";
import { OKB_NATIVE, XLAYER_USDG, XLAYER_USDC } from "../config/chains";
import {
  getRecentTrades,
  getRecentSignals,
  getRecentPayments,
  getRecentScores,
  getTradeSummary,
  getTotalUsdgEarned,
  getLastTickAt,
  getCompoundHistory,
} from "../memory/db";
import { env } from "../env";
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
  const [summary, totalUsdgEarned, lastTickAt] = await Promise.all([
    getTradeSummary(),
    getTotalUsdgEarned(),
    getLastTickAt(),
  ]);
  const status = getMeshStatus();

  const nextCycleAt = lastTickAt
    ? new Date(new Date(lastTickAt).getTime() + env.CHECK_INTERVAL_MINUTES * 60 * 1000).toISOString()
    : null;

  return c.json<ApiResponse<typeof summary & { mesh: typeof status; totalUsdgEarned: number; lastTickAt: string | null; nextCycleAt: string | null }>>({
    success: true,
    data: { ...summary, mesh: status, totalUsdgEarned, lastTickAt, nextCycleAt },
  });
});

meshRouter.get("/economy", async (c) => {
  const [summary, totalUsdgEarned, lastTickAt, compoundHistory] = await Promise.all([
    getTradeSummary(),
    getTotalUsdgEarned(),
    getLastTickAt(),
    getCompoundHistory(5),
  ]);

  const nextCycleAt = lastTickAt
    ? new Date(new Date(lastTickAt).getTime() + env.CHECK_INTERVAL_MINUTES * 60 * 1000).toISOString()
    : null;

  const okbPriceUsd = 30;
  const earnedUsd = totalUsdgEarned;
  const spentUsd = summary.totalOkbSpent * okbPriceUsd;
  const earnSpendRatio = spentUsd > 0 ? earnedUsd / spentUsd : 0;

  return c.json<ApiResponse<Record<string, unknown>>>({
    success: true,
    data: {
      totalUsdgEarned,
      totalOkbSpent: summary.totalOkbSpent,
      earnSpendRatio: Number(earnSpendRatio.toFixed(4)),
      lastTickAt,
      nextCycleAt,
      cycleIntervalMinutes: env.CHECK_INTERVAL_MINUTES,
      tradeCount: summary.total,
      tradeSuccessRate: summary.total > 0 ? summary.success / summary.total : 0,
      compoundHistory,
    },
  });
});

meshRouter.get("/balances", async (c) => {
  const configs = getAgentConfigs();

  const results = await Promise.allSettled(
    Object.values(configs).map(async (agent) => {
      const { tokens, totalUsdValue } = await getAllBalances(agent.walletAddress);

      const okb = tokens.find(
        (t) => t.tokenAddress.toLowerCase() === OKB_NATIVE.toLowerCase() || t.symbol === "OKB",
      );
      const usdg = tokens.find(
        (t) => t.tokenAddress.toLowerCase() === XLAYER_USDG.toLowerCase(),
      );
      const usdc = tokens.find(
        (t) => t.tokenAddress.toLowerCase() === XLAYER_USDC.toLowerCase(),
      );

      return {
        name: agent.name,
        walletAddress: agent.walletAddress,
        okb: okb?.balance ?? "0",
        okbUsd: okb?.usdValue ?? "0",
        usdg: usdg?.balance ?? "0",
        usdc: usdc?.balance ?? "0",
        totalUsdValue,
      };
    }),
  );

  const balances = results.map((r, i) => {
    const agent = Object.values(configs)[i];
    if (r.status === "fulfilled") return r.value;
    return {
      name: agent.name,
      walletAddress: agent.walletAddress,
      okb: "0",
      okbUsd: "0",
      usdg: "0",
      usdc: "0",
      totalUsdValue: "0",
      error: String((r as PromiseRejectedResult).reason),
    };
  });

  return c.json<ApiResponse<typeof balances>>({ success: true, data: balances });
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
