import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

/**
 * Browser Supabase client (publishable key). Use in Client Components only.
 * Session is stored in cookies via middleware refresh.
 */
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
