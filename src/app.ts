import { Hono } from "hono";
import { cors } from "hono/cors";
import { scoutRouter } from "./routes/scout";
import { analystRouter } from "./routes/analyst";
import { meshRouter } from "./routes/mesh";

export function createApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "X-Payment", "Authorization"],
      exposeHeaders: ["X-Payment-Required", "X-Payment-Response", "X-Payment"],
    }),
  );

  app.get("/health", (c) =>
    c.json({ status: "ok", timestamp: new Date().toISOString() }),
  );

  app.route("/scout", scoutRouter);
  app.route("/analyst", analystRouter);
  app.route("/mesh", meshRouter);

  app.onError((err, c) => {
    console.error("[App Error]", err);
    return c.json({ success: false, error: err.message }, 500);
  });

  return app;
}
