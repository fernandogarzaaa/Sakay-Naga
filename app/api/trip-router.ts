import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import {
  findActiveTrips,
  findTripsByDriver,
  findTripById,
  createTrip,
  endTrip,
} from "./queries/sakay";

export const tripRouter = createRouter({
  list: publicQuery.query(() => findActiveTrips()),
  byDriver: authedQuery
    .input(z.object({ driverId: z.number() }))
    .query(({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "operator" && ctx.user.id !== input.driverId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own trips." });
      }
      return findTripsByDriver(input.driverId);
    }),
  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findTripById(input.id)),
  start: authedQuery
    .input(z.object({
      jeepneyId: z.number().int().positive(),
      routeId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "driver" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Driver access required." });
      }
      try {
        return await createTrip({
          ...input,
          driverId: ctx.user.id,
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Unable to start trip.",
        });
      }
    }),
  end: authedQuery
    .input(z.object({ tripId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "driver" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Driver access required." });
      }
      try {
        return await endTrip(input.tripId, ctx.user.role === "admin" ? undefined : ctx.user.id);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Unable to end trip.",
        });
      }
    }),
});
