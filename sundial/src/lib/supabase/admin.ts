import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role client — bypasses RLS. Server-only: used by the tRPC API layer,
 * agent runtime, webhooks, and cron jobs. Never import from client components.
 */
let _admin: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function adminClient() {
  if (!_admin) {
    _admin = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return _admin;
}
