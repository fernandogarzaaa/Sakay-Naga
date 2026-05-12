export type CrowdingStatus =
  | "maluwag"
  | "may_seats_pa"
  | "halos_puno"
  | "puno_na"
  | "unsafe"
  | "unknown";

export type User = {
  id: number;
  name?: string | null;
  email?: string | null;
  role: "user" | "driver" | "operator" | "admin";
};

export type RouteSummary = {
  id: number;
  name: string;
  code: string;
  origin: string;
  destination: string;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
};

export type Stop = {
  id: number;
  name: string;
  landmark?: string | null;
  latitude?: string;
  longitude?: string;
};

export type RouteStop = {
  id: number;
  sequence: number;
  stop: Stop;
};

export type RouteDetail = RouteSummary & {
  stops?: RouteStop[];
};

export type Crowding = {
  status: CrowdingStatus;
  confidence: number;
  count: number;
  lastReport?: string;
};

export type Jeepney = {
  id: number;
  plateNumber: string;
  qrCode: string;
  capacity: number;
};

export type Trip = {
  id: number;
  driverId: number;
  jeepneyId: number;
  routeId: number;
  status: "active" | "completed" | "cancelled";
  startTime?: string;
  endTime?: string | null;
  passengerCount?: number | null;
  jeepney: Jeepney;
  route: RouteSummary;
  driver?: {
    id: number;
    name?: string | null;
  };
};

export type ReportPayload = {
  routeId: number;
  jeepneyId?: number;
  jeepneyQr?: string;
  tripId?: number;
  status: Exclude<CrowdingStatus, "unknown">;
  latitude?: number;
  longitude?: number;
  notes?: string;
};

export type DashboardStats = {
  totalRoutes: number;
  activeTrips: number;
  totalReports: number;
  totalJeepneys: number;
  recentReportsCount: number;
  statusDistribution: Record<string, number>;
};

export type OperatorDashboard = {
  stats: DashboardStats;
  routeAnalytics: Array<{
    routeId: number;
    count: number;
  }>;
};
