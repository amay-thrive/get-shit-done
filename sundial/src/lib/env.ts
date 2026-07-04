import { z } from "zod";

/**
 * Environment contract. Public vars are safe for the browser; server vars
 * must never be prefixed NEXT_PUBLIC_. Validation is lazy so builds succeed
 * without secrets, but any server code touching a missing var fails loudly.
 */
const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  // Optional until the integrations are activated
  OPENAI_API_KEY: z.string().optional(), // embeddings for semantic memory
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ZOHO_CLIENT_ID: z.string().optional(),
  ZOHO_CLIENT_SECRET: z.string().optional(),
  ZOHO_REFRESH_TOKEN: z.string().optional(),
  ZAPIER_WEBHOOK_SECRET: z.string().optional(),
});

export function serverEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Missing server environment variables: ${parsed.error.issues
        .map((i) => i.path.join("."))
        .join(", ")}`
    );
  }
  return parsed.data;
}

/** Non-throwing accessor for optional integrations. */
export function optionalEnv(key: string): string | undefined {
  const v = process.env[key];
  return v && v.length > 0 ? v : undefined;
}
