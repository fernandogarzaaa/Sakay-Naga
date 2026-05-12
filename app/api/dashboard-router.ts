import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import {
  getDashboardStats,
  getRouteAnalytics,
  getDriverProfile,
  createDriverProfile,
} from "./queries/sakay";

export const dashboardRouter = createRouter({
  stats: adminQuery.query(() => getDashboardStats()),
  routeAnalytics: adminQuery.query(() => getRouteAnalytics()),
});

export const driverRouter = createRouter({
  profile: authedQuery
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getDriverProfile(input.userId)),
  register: authedQuery
    .input(z.object({
      licenseNumber: z.string().optional(),
      jeepneyId: z.number().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createDriverProfile({
        ...input,
        userId: ctx.user.id,
      })
    ),
});
