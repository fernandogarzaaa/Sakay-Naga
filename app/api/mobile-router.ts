import { Hono } from "hono";
import { z } from "zod";
import type { User } from "@db/schema";
import { authenticateRequest, buildExpiredSessionCookie, buildSessionCookie } from "./auth/local";
import { verifyPassword } from "./auth/password";
import { buildSessionToken } from "./auth/session";
import {
  createReport,
  createTrip,
  endTrip,
  findActiveTrips,
  findAllJeepneys,
  findAllRoutes,
  findJeepneyByQr,
  findReportsByRoute,
  findRouteById,
  findRouteCrowdingStatus,
  findTripsByDriver,
  getDashboardStats,
  getRouteAnalytics,
} from "./queries/sakay";
import { createLocalUser, findUserByEmail, touchLastSignIn } from "./queries/users";
import { sanitizeForClient } from "./lib/sanitize";

const app = new Hono();

const crowdingStatuses = [
  "maluwag",
  "may_seats_pa",
  "halos_puno",
  "puno_na",
  "unsafe",
] as const;

const reportSchema = z.object({
  jeepneyId: z.number().optional(),
  jeepneyQr: z.string().optional(),
  routeId: z.number(),
  tripId: z.number().optional(),
  status: z.enum(crowdingStatuses),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().max(500).optional(),
});

const startTripSchema = z.object({
  jeepneyId: z.number(),
  routeId: z.number(),
});

const authSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

const registerSchema = authSchema.extend({
  name: z.string().min(1).max(120).transform((value) => value.trim()),
});

async function getAuthedUser(headers: Headers) {
  try {
    return await authenticateRequest(headers);
  } catch {
    return null;
  }
}

function hasAnyRole(user: User, roles: User["role"][]) {
  return roles.includes(user.role);
}

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "sakay-naga-mobile",
    timestamp: new Date().toISOString(),
  }),
);

app.get("/me", async (c) => {
  const user = await getAuthedUser(c.req.raw.headers);
  return c.json({ user: sanitizeForClient(user) });
});

app.post("/auth/register", async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid registration payload", details: parsed.error.flatten() }, 400);
  }

  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    return c.json({ error: "An account already exists for this email" }, 409);
  }

  const user = await createLocalUser(parsed.data);
  if (!user) {
    return c.json({ error: "Unable to create account" }, 500);
  }

  c.header("set-cookie", await buildSessionCookie(c.req.raw.headers, user.id), { append: true });
  return c.json({
    user: sanitizeForClient(user),
    token: await buildSessionToken({ userId: user.id }),
  }, 201);
});

app.post("/auth/login", async (c) => {
  const parsed = authSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid login payload", details: parsed.error.flatten() }, 400);
  }

  const user = await findUserByEmail(parsed.data.email);
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? null);
  if (!user || !valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const updatedUser = await touchLastSignIn(user.id);
  c.header("set-cookie", await buildSessionCookie(c.req.raw.headers, user.id), { append: true });
  return c.json({
    user: sanitizeForClient(updatedUser ?? user),
    token: await buildSessionToken({ userId: user.id }),
  });
});

app.post("/auth/logout", (c) => {
  c.header("set-cookie", buildExpiredSessionCookie(c.req.raw.headers), { append: true });
  return c.json({ success: true });
});

app.get("/routes", async (c) => {
  const routes = await findAllRoutes();
  return c.json({ routes });
});

app.get("/routes/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid route id" }, 400);
  }

  const route = await findRouteById(id);
  if (!route) {
    return c.json({ error: "Route not found" }, 404);
  }

  return c.json({ route: sanitizeForClient(route) });
});

app.get("/routes/:id/crowding", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid route id" }, 400);
  }

  const crowding = await findRouteCrowdingStatus(id);
  return c.json({ crowding });
});

app.get("/routes/:id/reports", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid route id" }, 400);
  }

  const reports = await findReportsByRoute(id, 25);
  return c.json({ reports: sanitizeForClient(reports) });
});

app.get("/trips", async (c) => {
  const trips = await findActiveTrips();
  return c.json({ trips: sanitizeForClient(trips) });
});

app.get("/jeepneys", async (c) => {
  const jeepneys = await findAllJeepneys();
  return c.json({ jeepneys });
});

app.get("/jeepneys/qr/:qrCode", async (c) => {
  const jeepney = await findJeepneyByQr(c.req.param("qrCode"));
  if (!jeepney) {
    return c.json({ error: "Jeepney not found" }, 404);
  }

  return c.json({ jeepney });
});

app.post("/reports", async (c) => {
  const user = await getAuthedUser(c.req.raw.headers);
  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const parsed = reportSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid report payload", details: parsed.error.flatten() }, 400);
  }

  let jeepneyId = parsed.data.jeepneyId;
  if (!jeepneyId && parsed.data.jeepneyQr) {
    const jeepney = await findJeepneyByQr(parsed.data.jeepneyQr);
    jeepneyId = jeepney?.id;
  }

  if (!jeepneyId) {
    return c.json({ error: "A jeepney id or valid QR code is required" }, 400);
  }

  const report = await createReport({
    userId: user.id,
    jeepneyId,
    routeId: parsed.data.routeId,
    tripId: parsed.data.tripId,
    status: parsed.data.status,
    latitude: parsed.data.latitude?.toString(),
    longitude: parsed.data.longitude?.toString(),
    notes: parsed.data.notes,
  });

  return c.json({ report: sanitizeForClient(report) }, 201);
});

app.get("/driver/trips", async (c) => {
  const user = await getAuthedUser(c.req.raw.headers);
  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }
  if (!hasAnyRole(user, ["driver", "admin"])) {
    return c.json({ error: "Driver access required" }, 403);
  }

  const trips = await findTripsByDriver(user.id);
  return c.json({ trips: sanitizeForClient(trips) });
});

app.post("/driver/trips", async (c) => {
  const user = await getAuthedUser(c.req.raw.headers);
  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }
  if (!hasAnyRole(user, ["driver", "admin"])) {
    return c.json({ error: "Driver access required" }, 403);
  }

  const parsed = startTripSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid trip payload", details: parsed.error.flatten() }, 400);
  }

  const trip = await createTrip({
    driverId: user.id,
    jeepneyId: parsed.data.jeepneyId,
    routeId: parsed.data.routeId,
  });
  return c.json({ trip: sanitizeForClient(trip) }, 201);
});

app.post("/driver/trips/:id/end", async (c) => {
  const user = await getAuthedUser(c.req.raw.headers);
  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }
  if (!hasAnyRole(user, ["driver", "admin"])) {
    return c.json({ error: "Driver access required" }, 403);
  }

  const tripId = Number(c.req.param("id"));
  if (!Number.isInteger(tripId)) {
    return c.json({ error: "Invalid trip id" }, 400);
  }

  const trip = await endTrip(tripId);
  return c.json({ trip: sanitizeForClient(trip) });
});

app.get("/operator/dashboard", async (c) => {
  const user = await getAuthedUser(c.req.raw.headers);
  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }
  if (!hasAnyRole(user, ["operator", "admin"])) {
    return c.json({ error: "Operator access required" }, 403);
  }

  const [stats, routeAnalytics] = await Promise.all([
    getDashboardStats(),
    getRouteAnalytics(),
  ]);
  return c.json({ stats, routeAnalytics });
});

export const mobileRouter = app;
