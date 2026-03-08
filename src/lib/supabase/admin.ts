import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key. Bypasses RLS.
 *
 * SECURITY: Use only for bootstrap or trusted server operations (e.g. ensureProfile).
 * Do not use in tenant-facing API routes — org-scoped data must go through the
 * cookie-based client so RLS enforces organization isolation.
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  }
  return createClient(url, key);
}
