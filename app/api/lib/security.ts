import type { Context, Next } from "hono";
import { env } from "./env";

const windows = new Map<string, { count: number; resetAt: number }>();

const rateLimitWindowMs = 60_000;
const defaultLimit = 180;
const authLimit = 20;

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

export async function rateLimit(c: Context, next: Next) {
  const path = new URL(c.req.url).pathname;
  const limit = path.includes("/auth/") ? authLimit : defaultLimit;
  const key = `${clientIp(c.req.raw.headers)}:${path.includes("/auth/") ? "auth" : "api"}`;
  const now = Date.now();
  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
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

function clientIp(headers: Headers) {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}
