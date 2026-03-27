import { setup } from "./setup";
import { createApp } from "./app";

await setup();

const app = createApp();

export default {
  port: 3001,
  fetch: app.fetch,
};

console.log("[LiquidMesh] Backend running on http://localhost:3001");
