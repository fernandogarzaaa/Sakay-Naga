import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { routeRouter, jeepneyRouter } from "./route-router";
import { tripRouter } from "./trip-router";
import { reportRouter } from "./report-router";
import { dashboardRouter, driverRouter } from "./dashboard-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  route: routeRouter,
  jeepney: jeepneyRouter,
  trip: tripRouter,
  report: reportRouter,
  dashboard: dashboardRouter,
  driver: driverRouter,
});

export type AppRouter = typeof appRouter;
