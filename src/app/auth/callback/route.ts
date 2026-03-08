import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { getSafeRedirectUrl, getSafeRedirectErrorCode } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const safeNext = getSafeRedirectUrl(nextParam, "/");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

  if (authError) {
    const errorCode = getSafeRedirectErrorCode("auth_failed", authError.message);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorCode)}`, request.url));
  }

  const user = data.user;
  if (!user?.id) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }

  const orgName = user.user_metadata?.organization_name as string | undefined;
  const result = await ensureProfile(user.id, orgName);

  if (!result.ok) {
    const errorCode = getSafeRedirectErrorCode("profile_failed", result.error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorCode)}`, request.url)
    );
  }

  const redirectUrl = new URL(safeNext, request.url);
  return NextResponse.redirect(redirectUrl);
}
