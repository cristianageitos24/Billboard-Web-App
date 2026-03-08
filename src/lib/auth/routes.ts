/**
 * Central config for public vs protected routes. Used by middleware and server guards.
 * By default only paths listed in PROTECTED_PATH_PREFIXES require auth; all others stay public.
 */

/** Paths that never require auth. Explicit list for clarity. */
export const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/auth/callback",
] as const;

/** Path prefixes that require auth when route protection is enabled (e.g. /dashboard, /account). */
export const PROTECTED_PATH_PREFIXES = [
  // "/dashboard",
  // "/account",
] as const;

/** Public API path prefixes — read-only catalog; no auth required. */
export const PUBLIC_API_PREFIXES = [
  "/api/billboards",
  "/api/cities",
  "/api/states",
  "/api/zipcodes",
] as const;

export function isPublicPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (PUBLIC_PATHS.some((p) => p === normalized)) {
    return true;
  }
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return false;
}

export function isProtectedPath(pathname: string): boolean {
  if (PROTECTED_PATH_PREFIXES.length === 0) {
    return false;
  }
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
