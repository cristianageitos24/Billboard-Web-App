import { type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { User } from "@supabase/supabase-js";

/**
 * Builds a server Supabase client from the request (cookies) and returns the current user.
 * Use in protected API route handlers: if null, return 401.
 *
 * Example:
 *   const user = await getUserFromRequest(request);
 *   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // API route: no need to set cookies on response for auth check
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
