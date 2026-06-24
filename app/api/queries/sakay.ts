import { getDb } from "./connection";
import { routes, routeStops, jeepneys, trips, reports, driverProfiles } from "@db/schema";
import { eq, like, and, desc, gte, count } from "drizzle-orm";
import { sanitizeForClient } from "../lib/sanitize";

export async function findAllRoutes() {
  return getDb().query.routes.findMany({
    orderBy: routes.name,
  });
}

export async function searchRoutes(query: string) {
  return getDb().select().from(routes).where(
    and(
      eq(routes.isActive, true),
      like(routes.name, `%${query}%`)
    )
  ).orderBy(routes.name);
}

export async function findRouteById(id: number) {
  return getDb().query.routes.findFirst({
    where: eq(routes.id, id),
    with: {
      stops: {
        with: {
          stop: true,
        },
        orderBy: routeStops.sequence,
      },
    },
  });
}

export async function findRouteCrowdingStatus(routeId: number) {
  const recentReports = await getDb().select().from(reports)
    .where(
      and(
        eq(reports.routeId, routeId),
        gte(reports.createdAt, new Date(Date.now() - 30 * 60 * 1000))
      )
    )
    .orderBy(desc(reports.createdAt))
    .limit(20);

  if (recentReports.length === 0) {
    return { status: "unknown", confidence: 0, count: 0 };
  }

  const statusCounts: Record<string, number> = {};
  for (const r of recentReports) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const dominantStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0];
  const confidence = Math.round((dominantStatus[1] / recentReports.length) * 100);

  return {
    status: dominantStatus[0],
    confidence,
    count: recentReports.length,
    lastReport: recentReports[0].createdAt,
  };
}

export async function findAllJeepneys() {
  return getDb().query.jeepneys.findMany({
    orderBy: jeepneys.plateNumber,
  });
}

export async function findJeepneyByQr(qrCode: string) {
  return getDb().query.jeepneys.findFirst({
    where: eq(jeepneys.qrCode, qrCode),
  });
}

export async function findJeepneyById(id: number) {
  return getDb().query.jeepneys.findFirst({
    where: eq(jeepneys.id, id),
  });
}

export async function findActiveTrips() {
  const rows = await getDb().query.trips.findMany({
    where: eq(trips.status, "active"),
    with: {
      driver: true,
      jeepney: true,
      route: true,
    },
    orderBy: desc(trips.startTime),
  });
  return sanitizeForClient(rows);
}

export async function findTripsByDriver(driverId: number) {
  const rows = await getDb().query.trips.findMany({
    where: eq(trips.driverId, driverId),
    with: {
      jeepney: true,
      route: true,
    },
    orderBy: desc(trips.startTime),
    limit: 50,
  });
  return sanitizeForClient(rows);
}

export async function findTripById(id: number) {
  const row = await getDb().query.trips.findFirst({
    where: eq(trips.id, id),
    with: {
      driver: true,
      jeepney: true,
      route: true,
    },
  });
  return sanitizeForClient(row);
}

export async function findTripRecordById(id: number) {
  return getDb().query.trips.findFirst({
    where: eq(trips.id, id),
  });
}

export async function findActiveTripByDriver(driverId: number) {
  return getDb().query.trips.findFirst({
    where: and(eq(trips.driverId, driverId), eq(trips.status, "active")),
  });
}

export async function findActiveTripByJeepney(jeepneyId: number) {
  return getDb().query.trips.findFirst({
    where: and(eq(trips.jeepneyId, jeepneyId), eq(trips.status, "active")),
  });
}

export async function validateTripStart(data: { driverId: number; jeepneyId: number; routeId: number }) {
  const [route, jeepney, driverActiveTrip, jeepneyActiveTrip] = await Promise.all([
    findRouteById(data.routeId),
    findJeepneyById(data.jeepneyId),
    findActiveTripByDriver(data.driverId),
    findActiveTripByJeepney(data.jeepneyId),
  ]);

  if (!route || !route.isActive) return "Route is not available.";
  if (!jeepney || !jeepney.isActive) return "Jeepney is not available.";
  if (driverActiveTrip) return "Driver already has an active trip.";
  if (jeepneyActiveTrip) return "Jeepney already has an active trip.";
  return null;
}

export async function createTrip(data: { driverId: number; jeepneyId: number; routeId: number }) {
  const validationError = await validateTripStart(data);
  if (validationError) {
    throw new Error(validationError);
  }

  const [{ id }] = await getDb().insert(trips).values({
    ...data,
    status: "active",
    startTime: new Date(),
  }).$returningId();
  return findTripById(id);
}

export async function endTrip(tripId: number, driverId?: number) {
  const existingTrip = await findTripRecordById(tripId);
  if (!existingTrip) {
    throw new Error("Trip not found.");
  }
  if (driverId && existingTrip.driverId !== driverId) {
    throw new Error("You can only end your own trip.");
  }
  if (existingTrip.status !== "active") {
    throw new Error("Trip is not active.");
  }

  await getDb().update(trips).set({
    status: "completed",
    endTime: new Date(),
  }).where(eq(trips.id, tripId));
  return findTripById(tripId);
}

export async function createReport(data: {
  userId: number;
  jeepneyId: number;
  routeId: number;
  tripId?: number;
  status: "maluwag" | "may_seats_pa" | "halos_puno" | "puno_na" | "unsafe";
  latitude?: string;
  longitude?: string;
  notes?: string;
}) {
  const [route, jeepney, trip] = await Promise.all([
    findRouteById(data.routeId),
    findJeepneyById(data.jeepneyId),
    data.tripId ? findTripRecordById(data.tripId) : Promise.resolve(undefined),
  ]);

  if (!route || !route.isActive) {
    throw new Error("Route is not available.");
  }
  if (!jeepney || !jeepney.isActive) {
    throw new Error("Jeepney is not available.");
  }
  if (data.tripId && !trip) {
    throw new Error("Trip not found.");
  }
  if (trip && (trip.routeId !== data.routeId || trip.jeepneyId !== data.jeepneyId)) {
    throw new Error("Trip does not match the selected route and jeepney.");
  }
  if (data.latitude !== undefined) {
    const latitude = Number(data.latitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error("Latitude must be between -90 and 90.");
    }
  }
  if (data.longitude !== undefined) {
    const longitude = Number(data.longitude);
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error("Longitude must be between -180 and 180.");
    }
  }

  const [{ id }] = await getDb().insert(reports).values(data).$returningId();
  const row = await getDb().query.reports.findFirst({
    where: eq(reports.id, id),
    with: {
      user: true,
      jeepney: true,
      route: true,
    },
  });
  return sanitizeForClient(row);
}

export async function findReportsByRoute(routeId: number, limit = 50) {
  const rows = await getDb().query.reports.findMany({
    where: eq(reports.routeId, routeId),
    with: {
      user: true,
      jeepney: true,
      route: true,
    },
    orderBy: desc(reports.createdAt),
    limit,
  });
  return sanitizeForClient(rows);
}

export async function findRecentReports(limit = 100) {
  const rows = await getDb().query.reports.findMany({
    with: {
      user: true,
      jeepney: true,
      route: true,
    },
    orderBy: desc(reports.createdAt),
    limit,
  });
  return sanitizeForClient(rows);
}

export async function getDriverProfile(userId: number) {
  return getDb().query.driverProfiles.findFirst({
    where: eq(driverProfiles.userId, userId),
    with: {
      jeepney: true,
    },
  });
}

export async function createDriverProfile(data: {
  userId: number;
  licenseNumber?: string;
  jeepneyId?: number;
}) {
  const [{ id }] = await getDb().insert(driverProfiles).values(data).$returningId();
  return getDb().query.driverProfiles.findFirst({
    where: eq(driverProfiles.id, id),
    with: {
      jeepney: true,
    },
  });
}

export async function getDashboardStats() {
  const db = getDb();
  const totalRoutes = await db.select({ count: count() }).from(routes).where(eq(routes.isActive, true));
  const activeTrips = await db.select({ count: count() }).from(trips).where(eq(trips.status, "active"));
  const totalReports = await db.select({ count: count() }).from(reports);
  const totalJeepneys = await db.select({ count: count() }).from(jeepneys).where(eq(jeepneys.isActive, true));

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const recentReports = await db.select().from(reports)
    .where(gte(reports.createdAt, thirtyMinAgo))
    .orderBy(desc(reports.createdAt));

  const statusCounts: Record<string, number> = {};
  for (const r of recentReports) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  return {
    totalRoutes: totalRoutes[0].count,
    activeTrips: activeTrips[0].count,
    totalReports: totalReports[0].count,
    totalJeepneys: totalJeepneys[0].count,
    recentReportsCount: recentReports.length,
    statusDistribution: statusCounts,
  };
}

export async function getRouteAnalytics() {
  const db = getDb();
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  const routeStats = await db.select({
    routeId: reports.routeId,
    count: count(),
  }).from(reports)
    .where(gte(reports.createdAt, thirtyMinAgo))
    .groupBy(reports.routeId);

  return routeStats;
}
