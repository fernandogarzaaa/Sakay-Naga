import type { CookieOptions } from "hono/utils/cookie";

function isLocalhost(headers: Headers): boolean {
  const host = headers.get("host") || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

/**
 * Session cookies default to SameSite=Lax so they are not sent on cross-site
 * POSTs (CSRF). Set SESSION_COOKIE_SAMESITE=none only when the web app is
 * genuinely served from a different site than the API; that also forces Secure.
 */
export function getSessionCookieOptions(
  headers: Headers,
  sameSiteSetting = process.env.SESSION_COOKIE_SAMESITE,
): CookieOptions {
  const localhost = isLocalhost(headers);
  const crossSite = (sameSiteSetting ?? "").trim().toLowerCase() === "none";

  return {
    httpOnly: true,
    path: "/",
    sameSite: crossSite ? "None" : "Lax",
    secure: crossSite || !localhost,
  };
}
