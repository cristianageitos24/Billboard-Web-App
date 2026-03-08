import { createClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

/**
 * Server-side Supabase client using only the publishable (anon) key — no cookies.
 * Use only for public, unauthenticated reads (e.g. billboard inventory, states, cities).
 * RLS is enforced; this client has no user session, so only anon/authenticated policies
 * that allow anon apply. Never use for org-scoped or user-scoped data.
 */
export function createPublicSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabasePublishableKey());
}
