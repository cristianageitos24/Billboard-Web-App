"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { getSafeRedirectErrorCode } from "@/lib/auth/redirect";

/**
 * Ensures the current user has a profile (and org), then redirects to home.
 * Call after signUp when session exists (e.g. when email confirmation is disabled).
 */
export async function ensureProfileAndRedirect() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    redirect("/login");
  }
  const result = await ensureProfile(user.id, user.user_metadata?.organization_name as string | undefined);
  if (!result.ok) {
    const errorCode = getSafeRedirectErrorCode("profile_failed", result.error);
    redirect(`/login?error=${encodeURIComponent(errorCode)}`);
  }
  redirect("/");
}

/**
 * Signs out the current user and redirects to home.
 */
export async function signOutAndRedirect() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
