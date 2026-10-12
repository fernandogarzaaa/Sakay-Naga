import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { Context } from "hono";
import { clientIp, isAuthPath, rateLimit, resetRateLimitState, securityHeaders } from "./security";
import { getSessionCookieOptions } from "./cookies";

function limitedApp() {
  const app = new Hono();
  app.use("*", rateLimit);
  app.all("*", (c) => c.json({ ok: true }));
  return app;
}

async function hit(app: Hono, path: string, times: number, headers: Record<string, string> = {}) {
  let last = new Response();
  for (let i = 0; i < times; i += 1) {
    last = await app.request(path, { method: "POST", headers });
  }
  return last;
}

function ctxWith(headers: Record<string, string>, remoteAddress?: string): Context {
  return {
    req: { raw: new Request("http://example.test/", { headers }) },
    env: remoteAddress ? { incoming: { socket: { remoteAddress } } } : undefined,
  } as unknown as Context;
}

describe("security middleware", () => {
  const savedTrustProxy = process.env.TRUST_PROXY;
  beforeEach(() => {
    resetRateLimitState();
    delete process.env.TRUST_PROXY;
  });
  afterEach(() => {
    if (savedTrustProxy === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = savedTrustProxy;
  });

  it("adds baseline security headers to API responses", async () => {
    const app = new Hono();
    app.use("*", securityHeaders);
    app.get("/api/check", (c) => c.json({ ok: true }));

    const response = await app.request("/api/check");

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("rate limits repeated mobile auth requests at 20/min", async () => {
    const app = limitedApp();
    expect((await hit(app, "/api/mobile/auth/login", 20)).status).toBe(200);
    expect((await hit(app, "/api/mobile/auth/login", 1)).status).toBe(429);
  });

  it("applies the auth limit to tRPC auth.* procedures (web login)", async () => {
    const app = limitedApp();
    expect((await hit(app, "/api/trpc/auth.login", 20)).status).toBe(200);
    expect((await hit(app, "/api/trpc/auth.login", 1)).status).toBe(429);
  });

  it("applies the auth limit to batched tRPC calls containing auth.*", async () => {
    const app = limitedApp();
    expect((await hit(app, "/api/trpc/routes.list,auth.register?batch=1", 21)).status).toBe(429);
  });

  it("keeps the general limit for non-auth tRPC procedures", async () => {
    const app = limitedApp();
    expect((await hit(app, "/api/trpc/routes.list", 21)).status).toBe(200);
    expect((await hit(app, "/api/trpc/routes.list", 159)).status).toBe(200);
    expect((await hit(app, "/api/trpc/routes.list", 1)).status).toBe(429);
  });

  it("classifies auth paths", () => {
    expect(isAuthPath("/api/trpc/auth.login")).toBe(true);
    expect(isAuthPath("/api/trpc/routes.list%2Cauth.me")).toBe(true);
    expect(isAuthPath("/api/mobile/auth/register")).toBe(true);
    expect(isAuthPath("/api/trpc/routes.list")).toBe(false);
    expect(isAuthPath("/api/trpc/oauth.login")).toBe(false);
    expect(isAuthPath("/api/health")).toBe(false);
  });

  it("ignores spoofed proxy headers when TRUST_PROXY is unset", async () => {
    const app = limitedApp();
    let last = new Response();
    for (let i = 0; i < 21; i += 1) {
      last = await app.request("/api/trpc/auth.login", {
        method: "POST",
        headers: { "x-forwarded-for": `198.51.100.${i}`, "x-real-ip": `198.51.100.${i}`, "cf-connecting-ip": `198.51.100.${i}` },
      });
    }
    expect(last.status).toBe(429);
  });

  it("uses the peer address when no proxy is trusted", () => {
    expect(clientIp(ctxWith({ "x-real-ip": "1.1.1.1" }, "10.0.0.5"), undefined)).toBe("10.0.0.5");
    expect(clientIp(ctxWith({ "x-real-ip": "1.1.1.1" }), "false")).toBe("local");
  });

  it("honours cf-connecting-ip only in cloudflare mode", () => {
    const ctx = ctxWith({ "cf-connecting-ip": "203.0.113.9", "x-real-ip": "1.1.1.1" }, "10.0.0.5");
    expect(clientIp(ctx, "cloudflare")).toBe("203.0.113.9");
    expect(clientIp(ctx, "true")).toBe("1.1.1.1");
    expect(clientIp(ctxWith({}, "10.0.0.5"), "cloudflare")).toBe("10.0.0.5");
  });

  it("uses x-real-ip, then the right-most x-forwarded-for entry, behind one proxy", () => {
    expect(clientIp(ctxWith({ "x-real-ip": " 203.0.113.7 " }), "1")).toBe("203.0.113.7");
    expect(clientIp(ctxWith({ "x-forwarded-for": "6.6.6.6, 203.0.113.8" }), "TRUE")).toBe("203.0.113.8");
    expect(clientIp(ctxWith({ "x-forwarded-for": " , " }, "10.0.0.5"), "true")).toBe("10.0.0.5");
  });

  it("separates rate-limit buckets per trusted client IP", async () => {
    process.env.TRUST_PROXY = "true";
    const app = limitedApp();
    expect((await hit(app, "/api/trpc/auth.login", 21, { "x-real-ip": "203.0.113.1" })).status).toBe(429);
    expect((await hit(app, "/api/trpc/auth.login", 1, { "x-real-ip": "203.0.113.2" })).status).toBe(200);
  });
});

describe("session cookie options", () => {
  const remote = new Headers({ host: "sakay.example.com" });
  const local = new Headers({ host: "localhost:3000" });

  it("defaults to SameSite=Lax and Secure off-localhost", () => {
    expect(getSessionCookieOptions(remote, undefined)).toMatchObject({ httpOnly: true, path: "/", sameSite: "Lax", secure: true });
  });

  it("is Lax and not Secure on localhost", () => {
    expect(getSessionCookieOptions(local, undefined)).toMatchObject({ sameSite: "Lax", secure: false });
    expect(getSessionCookieOptions(new Headers({ host: "127.0.0.1:3000" }), "")).toMatchObject({ secure: false });
  });

  it("only uses SameSite=None when explicitly configured, and then forces Secure", () => {
    expect(getSessionCookieOptions(remote, "None")).toMatchObject({ sameSite: "None", secure: true });
    expect(getSessionCookieOptions(local, "none")).toMatchObject({ sameSite: "None", secure: true });
    expect(getSessionCookieOptions(remote, "strict")).toMatchObject({ sameSite: "Lax" });
  });
});
