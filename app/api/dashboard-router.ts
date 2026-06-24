import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
    .input(z.object({ userId: z.number().int().positive() }))
    .query(({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "operator" && ctx.user.id !== input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own driver profile.",
        });
      }
      return getDriverProfile(input.userId);
    }),
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
