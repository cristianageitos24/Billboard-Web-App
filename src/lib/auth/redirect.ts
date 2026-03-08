/**
 * Returns a safe error code for redirect URLs. In production uses a generic code and logs the detail.
 */
export function getSafeRedirectErrorCode(
  genericCode: string,
  detailMessage: string
): string {
  if (process.env.NODE_ENV === "production") {
    console.error(`[auth] ${genericCode}:`, detailMessage);
    return genericCode;
  }
  return detailMessage;
}

/**
 * Safe redirect URL helper. Prevents open redirects by allowing only same-origin path-only URLs.
 * Rejects protocol-relative (//), absolute URLs (https://), and invalid paths.
 */
export function getSafeRedirectUrl(
  next: string | null,
  defaultPath: string
): string {
  if (next == null || next.trim() === "") {
    return defaultPath;
  }
  const path = next.trim();
  // Must start with exactly one slash (path-only), not // or scheme
  if (!path.startsWith("/") || path.startsWith("//")) {
    return defaultPath;
  }
  // Reject URLs that look like they have a scheme (e.g. /https://evil)
  if (/^\/[a-z][a-z0-9+.-]*:\/\//i.test(path)) {
    return defaultPath;
  }
  return path;
}
