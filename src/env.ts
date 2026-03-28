import { z } from "zod";

const schema = z.object({
  // OKX OnchainOS
  OKX_API_KEY: z.string().min(1),
  OKX_SECRET_KEY: z.string().min(1),
  OKX_PASSPHRASE: z.string().min(1),

  // Agent TEE sub-accounts
  SCOUT_ACCOUNT_ID: z.string().min(1),
  SCOUT_WALLET_ADDRESS: z.string().min(1),
  ANALYST_ACCOUNT_ID: z.string().min(1),
  ANALYST_WALLET_ADDRESS: z.string().min(1),
  EXECUTOR_ACCOUNT_ID: z.string().min(1),
  EXECUTOR_WALLET_ADDRESS: z.string().min(1),
  ORCHESTRATOR_ACCOUNT_ID: z.string().min(1),
  ORCHESTRATOR_WALLET_ADDRESS: z.string().min(1),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1),

  // Runtime config
  PUBLIC_API_URL: z.string().url().default("http://localhost:3000"),
  EXECUTOR_SWAP_AMOUNT_OKB: z.string().default("0.001"),
  CHECK_INTERVAL_MINUTES: z.coerce.number().default(30),
  ENABLE_AGENTS: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

function parseEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    for (const [key, issues] of Object.entries(
      result.error.flatten().fieldErrors,
    )) {
      console.error(`  ${key}: ${issues?.join(", ")}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
export type Env = typeof env;
