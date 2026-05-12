import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { rateLimit, securityHeaders } from "./security";

describe("security middleware", () => {
  it("adds baseline security headers to API responses", async () => {
    const app = new Hono();
    app.use("*", securityHeaders);
    app.get("/api/check", (c) => c.json({ ok: true }));

    const response = await app.request("/api/check");

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("rate limits repeated auth requests", async () => {
    const app = new Hono();
    app.use("*", rateLimit);
    app.post("/api/mobile/auth/login-test", (c) => c.json({ ok: true }));

    let lastResponse = new Response();
    for (let i = 0; i < 21; i += 1) {
      lastResponse = await app.request("/api/mobile/auth/login-test", {
        method: "POST",
        headers: { "x-real-ip": "203.0.113.44" },
      });
    }

    expect(lastResponse.status).toBe(429);
  });
});
