import { z } from "zod";
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
      jeepneyId: z.number(),
      routeId: z.number(),
      tripId: z.number().optional(),
      status: z.enum(["maluwag", "may_seats_pa", "halos_puno", "puno_na", "unsafe"]),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createReport({
        ...input,
        userId: ctx.user.id,
        latitude: input.latitude?.toString(),
        longitude: input.longitude?.toString(),
      })
    ),
});
