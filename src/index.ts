import { setup } from "./setup";
import { createApp } from "./app";

await setup();

const app = createApp();

export default {
  port: 3001,
  fetch: app.fetch,
  idleTimeout: 120, // 2 minutes — tick can take time with AI + x402 calls
};

console.log("[LiquidMesh] Backend running on http://localhost:3001");
