import type { Context, Next } from "hono";
import { env } from "./env";

const windows = new Map<string, { count: number; resetAt: number }>();

const rateLimitWindowMs = 60_000;
const defaultLimit = 180;
const authLimit = 20;
const maxTrackedKeys = 10_000;

export async function securityHeaders(c: Context, next: Next) {
  await next();

  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  if (env.isProduction) {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

/**
 * True for credential endpoints: REST routes under `/auth/` (mobile API) and
 * tRPC calls to any `auth.*` procedure, including batched calls such as
 * `/api/trpc/routes.list,auth.login?batch=1`.
 */
export function isAuthPath(pathname: string): boolean {
  if (pathname.includes("/auth/")) return true;
  const marker = "/api/trpc/";
  const idx = pathname.indexOf(marker);
  if (idx === -1) return false;
  const procedures = decodeURIComponent(pathname.slice(idx + marker.length)).split(",");
  return procedures.some((p) => p.trim().startsWith("auth."));
}

function evictExpired(now: number) {
  for (const [key, value] of windows) {
    if (value.resetAt <= now) windows.delete(key);
  }
}

export function resetRateLimitState() {
  windows.clear();
}

export async function rateLimit(c: Context, next: Next) {
  const path = new URL(c.req.url).pathname;
  const auth = isAuthPath(path);
  const limit = auth ? authLimit : defaultLimit;
  const key = `${clientIp(c)}:${auth ? "auth" : "api"}`;
  const now = Date.now();
  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
    if (windows.size >= maxTrackedKeys) evictExpired(now);
    windows.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    await next();
    return;
  }

  current.count += 1;
  if (current.count > limit) {
    return c.json({ error: "Too many requests" }, 429);
  }

  await next();
}

/**
 * Proxy headers are client-controlled unless a trusted proxy sets them, so they
 * are only honoured when TRUST_PROXY is configured:
 * - unset / "false": use the TCP peer address (headers ignored)
 * - "cloudflare": use `cf-connecting-ip`
 * - "true" / "1": one trusted reverse proxy; use `x-real-ip`, else the
 *   right-most `x-forwarded-for` entry (the one the proxy appended)
 */
export function clientIp(c: Context, trustProxy = process.env.TRUST_PROXY): string {
  const headers = c.req.raw.headers;
  const mode = (trustProxy ?? "").trim().toLowerCase();

  if (mode === "cloudflare") {
    const ip = headers.get("cf-connecting-ip")?.trim();
    if (ip) return ip;
  } else if (mode === "true" || mode === "1") {
    const realIp = headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
    const forwarded = headers
      .get("x-forwarded-for")
      ?.split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (forwarded && forwarded.length > 0) return forwarded[forwarded.length - 1];
  }

  return peerAddress(c) ?? "local";
}

function peerAddress(c: Context): string | undefined {
  const bindings = c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined;
  return bindings?.incoming?.socket?.remoteAddress;
}
