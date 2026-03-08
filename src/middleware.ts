import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isProtectedPath } from "@/lib/auth/routes";
import { getSafeRedirectUrl } from "@/lib/auth/redirect";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (isProtectedPath(pathname) && !user) {
    const safeNext = getSafeRedirectUrl(pathname, "/");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", safeNext);
    return Response.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
