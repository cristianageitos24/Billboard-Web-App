import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectUrl } from "@/lib/auth/redirect";
import type { User } from "@supabase/supabase-js";

export interface RequireUserOptions {
  /** Path to redirect to after login. Pass the current page path so the user returns here. */
  next?: string;
}

/**
 * Server guard: ensures a user is authenticated. Use in Server Components or route handlers.
 * If no user, redirects to /login?next=<safe path>. Returns the user for the page to use.
 */
export async function requireUser(
  options: RequireUserOptions = {}
): Promise<User> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const safeNext = getSafeRedirectUrl(options.next ?? null, "/");
    redirect(`/login?next=${encodeURIComponent(safeNext)}`);
  }

  return user;
}
