import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

export interface UpdateSessionResult {
  response: NextResponse;
  user: User | null;
}

/**
 * Refreshes the Supabase auth session and updates cookies. Call from middleware.
 * Returns the response and the current user so callers can enforce protected routes.
 */
export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  let supabaseResponse = NextResponse.next({ request });

  let url: string;
  let key: string;
  try {
    url = getSupabaseUrl();
    key = getSupabasePublishableKey();
  } catch {
    return { response: supabaseResponse, user: null };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  return { response: supabaseResponse, user };
}
