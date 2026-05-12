import type {
  Crowding,
  Jeepney,
  OperatorDashboard,
  ReportPayload,
  RouteDetail,
  RouteSummary,
  Trip,
  User,
} from "./types";
import * as SecureStore from "expo-secure-store";

const apiUrlFromEnv = process.env.EXPO_PUBLIC_API_URL;
export const API_URL = apiUrlFromEnv || "http://localhost:3000/api/mobile";
const tokenKey = "sakay_naga_session_token";

let sessionToken: string | null = null;

type RequestOptions = RequestInit & {
  timeoutMs?: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        body && typeof body === "object" && "error" in body
          ? String(body.error)
          : `Request failed with ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  async loadSession() {
    sessionToken = await SecureStore.getItemAsync(tokenKey);
    return sessionToken;
  },
  async setSessionToken(token: string | null) {
    sessionToken = token;
    if (token) {
      await SecureStore.setItemAsync(tokenKey, token);
    } else {
      await SecureStore.deleteItemAsync(tokenKey);
    }
  },
  async health() {
    return request<{ ok: boolean; service: string; timestamp: string }>("/health");
  },
  async me() {
    const response = await request<{ user: User | null }>("/me");
    return response.user;
  },
  async login(payload: { email: string; password: string }) {
    const response = await request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await api.setSessionToken(response.token);
    return response.user;
  },
  async register(payload: { name: string; email: string; password: string }) {
    const response = await request<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await api.setSessionToken(response.token);
    return response.user;
  },
  async logout() {
    try {
      return await request<{ success: boolean }>("/auth/logout", { method: "POST" });
    } finally {
      await api.setSessionToken(null);
    }
  },
  async routes() {
    const response = await request<{ routes: RouteSummary[] }>("/routes");
    return response.routes;
  },
  async route(id: number) {
    const response = await request<{ route: RouteDetail }>(`/routes/${id}`);
    return response.route;
  },
  async crowding(routeId: number) {
    const response = await request<{ crowding: Crowding }>(`/routes/${routeId}/crowding`);
    return response.crowding;
  },
  async trips() {
    const response = await request<{ trips: Trip[] }>("/trips");
    return response.trips;
  },
  async jeepneys() {
    const response = await request<{ jeepneys: Jeepney[] }>("/jeepneys");
    return response.jeepneys;
  },
  async submitReport(payload: ReportPayload) {
    return request<{ report: unknown }>("/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async startDriverTrip(payload: { routeId: number; jeepneyId: number }) {
    return request<{ trip: Trip }>("/driver/trips", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async endDriverTrip(tripId: number) {
    return request<{ trip: Trip }>(`/driver/trips/${tripId}/end`, {
      method: "POST",
    });
  },
  async operatorDashboard() {
    return request<OperatorDashboard>("/operator/dashboard");
  },
};
