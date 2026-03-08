import { createServerSupabaseClient } from "@/lib/supabase/admin";

const DEFAULT_ORG_NAME = "My Organization";

/**
 * Ensures the user has a profile and organization. Idempotent: if profile exists, no-op.
 *
 * Uses the service-role client because the user has no profile yet, so
 * current_org_id() would be null and RLS would block org/profile creation.
 * Call only from auth callback or signup action — never from tenant-facing APIs.
 */
export async function ensureProfile(
  userId: string,
  organizationName?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return { ok: true };
  }

  const name = organizationName?.trim() || DEFAULT_ORG_NAME;
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name })
    .select("id")
    .single();

  if (orgError || !org) {
    return { ok: false, error: orgError?.message ?? "Failed to create organization" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    organization_id: org.id,
  });

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  return { ok: true };
}
