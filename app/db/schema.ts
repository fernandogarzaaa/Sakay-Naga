import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  decimal,
  int,
  boolean,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "driver", "operator", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
}));

export const usersRelations = relations(users, ({ many }) => ({
  reports: many(reports),
  trips: many(trips),
  driverProfile: many(driverProfiles),
}));

export const routes = mysqlTable("routes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  origin: varchar("origin", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  codeIdx: index("code_idx").on(table.code),
  nameIdx: index("name_idx").on(table.name),
}));

export const routesRelations = relations(routes, ({ many }) => ({
  stops: many(routeStops),
  trips: many(trips),
  reports: many(reports),
}));

export const stops = mysqlTable("stops", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  landmark: varchar("landmark", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("stop_name_idx").on(table.name),
}));

export const stopsRelations = relations(stops, ({ many }) => ({
  routeStops: many(routeStops),
}));

export const routeStops = mysqlTable("route_stops", {
  id: serial("id").primaryKey(),
  routeId: bigint("routeId", { mode: "number", unsigned: true }).notNull(),
  stopId: bigint("stopId", { mode: "number", unsigned: true }).notNull(),
  sequence: int("sequence").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  routeIdx: index("route_stops_route_idx").on(table.routeId),
  stopIdx: index("route_stops_stop_idx").on(table.stopId),
}));

export const routeStopsRelations = relations(routeStops, ({ one }) => ({
  route: one(routes, { fields: [routeStops.routeId], references: [routes.id] }),
  stop: one(stops, { fields: [routeStops.stopId], references: [stops.id] }),
}));

export const jeepneys = mysqlTable("jeepneys", {
  id: serial("id").primaryKey(),
  plateNumber: varchar("plateNumber", { length: 50 }).notNull().unique(),
  qrCode: varchar("qrCode", { length: 255 }).notNull().unique(),
  capacity: int("capacity").default(20).notNull(),
  make: varchar("make", { length: 255 }),
  model: varchar("model", { length: 255 }),
  year: int("year"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  plateIdx: index("plate_idx").on(table.plateNumber),
  qrIdx: index("qr_idx").on(table.qrCode),
}));

export const jeepneysRelations = relations(jeepneys, ({ many }) => ({
  trips: many(trips),
  reports: many(reports),
}));

export const driverProfiles = mysqlTable("driver_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  licenseNumber: varchar("licenseNumber", { length: 255 }),
  jeepneyId: bigint("jeepneyId", { mode: "number", unsigned: true }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const driverProfilesRelations = relations(driverProfiles, ({ one }) => ({
  user: one(users, { fields: [driverProfiles.userId], references: [users.id] }),
  jeepney: one(jeepneys, { fields: [driverProfiles.jeepneyId], references: [jeepneys.id] }),
}));

export const trips = mysqlTable("trips", {
  id: serial("id").primaryKey(),
  driverId: bigint("driverId", { mode: "number", unsigned: true }).notNull(),
  jeepneyId: bigint("jeepneyId", { mode: "number", unsigned: true }).notNull(),
  routeId: bigint("routeId", { mode: "number", unsigned: true }).notNull(),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  currentLatitude: decimal("currentLatitude", { precision: 10, scale: 8 }),
  currentLongitude: decimal("currentLongitude", { precision: 11, scale: 8 }),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  passengerCount: int("passengerCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  driverIdx: index("driver_idx").on(table.driverId),
  routeIdx: index("trip_route_idx").on(table.routeId),
  statusIdx: index("status_idx").on(table.status),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  driver: one(users, { fields: [trips.driverId], references: [users.id] }),
  jeepney: one(jeepneys, { fields: [trips.jeepneyId], references: [jeepneys.id] }),
  route: one(routes, { fields: [trips.routeId], references: [routes.id] }),
  reports: many(reports),
}));

export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  jeepneyId: bigint("jeepneyId", { mode: "number", unsigned: true }).notNull(),
  routeId: bigint("routeId", { mode: "number", unsigned: true }).notNull(),
  tripId: bigint("tripId", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["maluwag", "may_seats_pa", "halos_puno", "puno_na", "unsafe"]).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  confidence: int("confidence").default(1),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("report_user_idx").on(table.userId),
  routeIdx: index("report_route_idx").on(table.routeId),
  jeepneyIdx: index("report_jeepney_idx").on(table.jeepneyId),
  statusIdx: index("report_status_idx").on(table.status),
  createdAtIdx: index("report_created_idx").on(table.createdAt),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
  jeepney: one(jeepneys, { fields: [reports.jeepneyId], references: [jeepneys.id] }),
  route: one(routes, { fields: [reports.routeId], references: [routes.id] }),
  trip: one(trips, { fields: [reports.tripId], references: [trips.id] }),
}));

export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  type: mysqlEnum("type", ["crowded", "unsafe", "announcement", "alert"]).notNull(),
  routeId: bigint("routeId", { mode: "number", unsigned: true }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notif_user_idx").on(table.userId),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  route: one(routes, { fields: [notifications.routeId], references: [routes.id] }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type Stop = typeof stops.$inferSelect;
export type RouteStop = typeof routeStops.$inferSelect;
export type Jeepney = typeof jeepneys.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type DriverProfile = typeof driverProfiles.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
