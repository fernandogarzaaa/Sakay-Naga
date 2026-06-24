import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import {
  createReport,
  findReportsByRoute,
  findRecentReports,
} from "./queries/sakay";

export const reportRouter = createRouter({
  list: publicQuery.query(() => findRecentReports(50)),
  byRoute: publicQuery
    .input(z.object({ routeId: z.number() }))
    .query(({ input }) => findReportsByRoute(input.routeId)),
  submit: authedQuery
    .input(z.object({
      jeepneyId: z.number().int().positive(),
      routeId: z.number().int().positive(),
      tripId: z.number().int().positive().optional(),
      status: z.enum(["maluwag", "may_seats_pa", "halos_puno", "puno_na", "unsafe"]),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await createReport({
          ...input,
          userId: ctx.user.id,
          latitude: input.latitude?.toString(),
          longitude: input.longitude?.toString(),
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Unable to submit report.",
        });
      }
    }),
});
