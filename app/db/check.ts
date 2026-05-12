import { getDb } from "../api/queries/connection";
import { routes, stops, jeepneys, routeStops } from "./schema";

async function check() {
  const db = getDb();
  const r = await db.select().from(routes);
  const s = await db.select().from(stops);
  const j = await db.select().from(jeepneys);
  const rs = await db.select().from(routeStops);
  console.log(`Routes: ${r.length}, Stops: ${s.length}, Jeepneys: ${j.length}, RouteStops: ${rs.length}`);
}

check().catch(console.error);
