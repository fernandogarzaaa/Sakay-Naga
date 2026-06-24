import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { User } from "@db/schema";
import { appRouter } from "./router";
import { createTrip, endTrip, findTripsByDriver, getDriverProfile } from "./queries/sakay";

vi.mock("./queries/sakay", () => ({
  findActiveTrips: vi.fn(),
  findTripsByDriver: vi.fn(),
  findTripById: vi.fn(),
  createTrip: vi.fn(),
  endTrip: vi.fn(),
  findAllRoutes: vi.fn(),
  searchRoutes: vi.fn(),
  findRouteById: vi.fn(),
  findRouteCrowdingStatus: vi.fn(),
  findAllJeepneys: vi.fn(),
  findJeepneyByQr: vi.fn(),
  findJeepneyById: vi.fn(),
  createReport: vi.fn(),
  findReportsByRoute: vi.fn(),
  findRecentReports: vi.fn(),
  getDashboardStats: vi.fn(),
  getRouteAnalytics: vi.fn(),
  getDriverProfile: vi.fn(),
  createDriverProfile: vi.fn(),
}));

function user(overrides: Partial<User> = {}): User {
  return {
    id: 7,
    unionId: "local:test@example.com",
    name: "Test User",
    email: "test@example.com",
    passwordHash: "redacted",
    avatar: null,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignInAt: new Date(),
    ...overrides,
  };
}

function caller(currentUser: User) {
  return appRouter.createCaller({
    req: new Request("http://localhost/api/trpc"),
    resHeaders: new Headers(),
    user: currentUser,
  });
}

describe("authorization boundaries", () => {
  it("does not let non-drivers start trips", async () => {
    await expect(caller(user()).trip.start({ jeepneyId: 1, routeId: 2 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(createTrip).not.toHaveBeenCalled();
  });

  it("starts trips as the authenticated driver instead of accepting caller-supplied driver ids", async () => {
    vi.mocked(createTrip).mockResolvedValue({ id: 99 } as never);

    await caller(user({ id: 42, role: "driver" })).trip.start({ jeepneyId: 1, routeId: 2 });

    expect(createTrip).toHaveBeenCalledWith({ driverId: 42, jeepneyId: 1, routeId: 2 });
  });

  it("does not let drivers end trips they do not own", async () => {
    vi.mocked(endTrip).mockRejectedValue(new Error("You can only end your own trip."));

    await expect(caller(user({ id: 42, role: "driver" })).trip.end({ tripId: 99 })).rejects.toBeInstanceOf(TRPCError);

    expect(endTrip).toHaveBeenCalledWith(99, 42);
  });

  it("restricts driver trip history to self, admin, or operator", async () => {
    await expect(caller(user({ id: 42, role: "driver" })).trip.byDriver({ driverId: 7 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(findTripsByDriver).not.toHaveBeenCalled();
  });

  it("restricts driver profile lookup to self, admin, or operator", async () => {
    await expect(caller(user({ id: 42 })).driver.profile({ userId: 7 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(getDriverProfile).not.toHaveBeenCalled();
  });
});
