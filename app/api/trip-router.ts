import { z } from "zod";
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
    .query(({ input }) => findTripsByDriver(input.driverId)),
  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findTripById(input.id)),
  start: authedQuery
    .input(z.object({
      driverId: z.number(),
      jeepneyId: z.number(),
      routeId: z.number(),
    }))
    .mutation(({ input }) => createTrip(input)),
  end: authedQuery
    .input(z.object({ tripId: z.number() }))
    .mutation(({ input }) => endTrip(input.tripId)),
});
