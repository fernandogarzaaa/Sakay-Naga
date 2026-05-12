import type { Crowding, Jeepney, RouteDetail, RouteSummary, Trip } from "./types";

export const mockRoutes: RouteSummary[] = [
  {
    id: 1,
    name: "Bagumbayan - CBD",
    code: "BGM-CBD",
    origin: "Bagumbayan",
    destination: "CBD",
    color: "#EF4444",
  },
  {
    id: 2,
    name: "Cararayan - CBD",
    code: "CAR-CBD",
    origin: "Cararayan",
    destination: "CBD",
    color: "#2563EB",
  },
  {
    id: 3,
    name: "Concepcion - CBD",
    code: "CON-CBD",
    origin: "Concepcion Pequena",
    destination: "CBD",
    color: "#059669",
  },
  {
    id: 4,
    name: "Pacol - CBD",
    code: "PAC-CBD",
    origin: "Pacol",
    destination: "CBD",
    color: "#F59E0B",
  },
];

export const mockCrowding: Record<number, Crowding> = {
  1: { status: "may_seats_pa", confidence: 77, count: 9 },
  2: { status: "halos_puno", confidence: 64, count: 7 },
  3: { status: "maluwag", confidence: 82, count: 11 },
  4: { status: "unknown", confidence: 0, count: 0 },
};

export const mockJeepneys: Jeepney[] = [
  { id: 1, plateNumber: "ABC-123", qrCode: "SKN-JEEP-001", capacity: 20 },
  { id: 2, plateNumber: "DEF-456", qrCode: "SKN-JEEP-002", capacity: 22 },
  { id: 3, plateNumber: "GHI-789", qrCode: "SKN-JEEP-003", capacity: 20 },
];

export const mockTrips: Trip[] = [
  {
    id: 1,
    driverId: 1,
    jeepneyId: 1,
    routeId: 1,
    status: "active",
    startTime: new Date().toISOString(),
    passengerCount: 12,
    jeepney: mockJeepneys[0],
    route: mockRoutes[0],
    driver: { id: 1, name: "Demo Driver" },
  },
];

export function mockRouteDetail(id: number): RouteDetail | null {
  const route = mockRoutes.find((item) => item.id === id);
  if (!route) return null;

  return {
    ...route,
    stops: [
      {
        id: id * 10 + 1,
        sequence: 1,
        stop: { id: id * 10 + 1, name: route.origin, landmark: "Terminal" },
      },
      {
        id: id * 10 + 2,
        sequence: 2,
        stop: { id: id * 10 + 2, name: "Main Avenue", landmark: "City corridor" },
      },
      {
        id: id * 10 + 3,
        sequence: 3,
        stop: { id: id * 10 + 3, name: route.destination, landmark: "Central stop" },
      },
    ],
  };
}
