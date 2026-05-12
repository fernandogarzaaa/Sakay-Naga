import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findAllRoutes,
  searchRoutes,
  findRouteById,
  findRouteCrowdingStatus,
  findAllJeepneys,
  findJeepneyByQr,
  findJeepneyById,
} from "./queries/sakay";

export const routeRouter = createRouter({
  list: publicQuery.query(() => findAllRoutes()),
  search: publicQuery
    .input(z.object({ query: z.string().min(1) }))
    .query(({ input }) => searchRoutes(input.query)),
  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findRouteById(input.id)),
  crowding: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findRouteCrowdingStatus(input.id)),
});

export const jeepneyRouter = createRouter({
  list: publicQuery.query(() => findAllJeepneys()),
  byQr: publicQuery
    .input(z.object({ qrCode: z.string() }))
    .query(({ input }) => findJeepneyByQr(input.qrCode)),
  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findJeepneyById(input.id)),
});
