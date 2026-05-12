import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../api/client";
import { mockRouteDetail } from "../api/mockData";
import type { Crowding, RouteDetail, RouteSummary, Trip } from "../api/types";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Notice } from "../components/Notice";
import { Screen } from "../components/Screen";
import { StatusPill } from "../components/StatusPill";
import { colors } from "../theme/colors";

type Props = {
  routes: RouteSummary[];
  crowding: Record<number, Crowding>;
  trips: Trip[];
  offline: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onReportRoute: (route: RouteSummary) => void;
};

export function RiderScreen({
  routes,
  crowding,
  trips,
  offline,
  refreshing,
  onRefresh,
  onReportRoute,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<RouteDetail | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const filteredRoutes = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return routes;
    return routes.filter((route) =>
      `${route.name} ${route.origin} ${route.destination} ${route.code}`.toLowerCase().includes(lower),
    );
  }, [query, routes]);

  const openRoute = async (route: RouteSummary) => {
    setLoadingRoute(true);
    try {
      setSelectedRoute(await api.route(route.id));
    } catch {
      setSelectedRoute(mockRouteDetail(route.id));
    } finally {
      setLoadingRoute(false);
    }
  };

  if (selectedRoute) {
    const currentCrowding = crowding[selectedRoute.id] ?? { status: "unknown", confidence: 0, count: 0 };
    return (
      <Screen title={selectedRoute.name} subtitle={`${selectedRoute.origin} to ${selectedRoute.destination}`}>
        <Button variant="secondary" onPress={() => setSelectedRoute(null)}>
          Back to routes
        </Button>

        <Card>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.eyebrow}>Current crowding</Text>
              <StatusPill status={currentCrowding.status} confidence={currentCrowding.confidence} />
            </View>
            <Text style={styles.count}>{currentCrowding.count} reports</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Stops</Text>
          {selectedRoute.stops?.map((routeStop) => (
            <View key={routeStop.id} style={styles.stopRow}>
              <View style={styles.stopNumber}>
                <Text style={styles.stopNumberText}>{routeStop.sequence}</Text>
              </View>
              <View style={styles.stopCopy}>
                <Text style={styles.stopName}>{routeStop.stop.name}</Text>
                {routeStop.stop.landmark ? <Text style={styles.muted}>{routeStop.stop.landmark}</Text> : null}
              </View>
            </View>
          ))}
        </Card>

        <Button onPress={() => onReportRoute(selectedRoute)}>Report capacity</Button>
      </Screen>
    );
  }

  return (
    <Screen
      title="Sakay Naga"
      subtitle="Track jeepney routes, active trips, and crowding reports around Naga City."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {offline ? (
        <Notice
          title="Offline preview"
          body="The backend is not reachable from this device, so the app is showing bundled sample data."
          tone="warning"
        />
      ) : null}

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search route, origin, or destination"
        placeholderTextColor={colors.muted}
        style={styles.search}
      />

      <View style={styles.statsGrid}>
        <Card>
          <Text style={styles.statValue}>{routes.length}</Text>
          <Text style={styles.muted}>Routes</Text>
        </Card>
        <Card>
          <Text style={styles.statValue}>{trips.length}</Text>
          <Text style={styles.muted}>Active trips</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Routes</Text>
      {filteredRoutes.map((route) => {
        const currentCrowding = crowding[route.id] ?? { status: "unknown", confidence: 0, count: 0 };
        return (
          <Pressable key={route.id} onPress={() => openRoute(route)} disabled={loadingRoute}>
            <Card>
              <View style={styles.routeHeader}>
                <View style={[styles.routeStripe, { backgroundColor: route.color ?? colors.primary }]} />
                <View style={styles.routeCopy}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.muted}>{route.origin} to {route.destination}</Text>
                </View>
              </View>
              <View style={styles.routeFooter}>
                <StatusPill status={currentCrowding.status} confidence={currentCrowding.confidence} />
                <Button variant="secondary" onPress={() => onReportRoute(route)}>
                  Report
                </Button>
              </View>
            </Card>
          </Pressable>
        );
      })}

      <Text style={styles.sectionTitle}>Active trips</Text>
      {trips.length === 0 ? (
        <Notice title="No active trips" body="Driver check-ins will appear here once trips are started." />
      ) : (
        trips.map((trip) => (
          <Card key={trip.id}>
            <Text style={styles.routeName}>{trip.jeepney.plateNumber}</Text>
            <Text style={styles.muted}>{trip.route.name}</Text>
            <Text style={styles.tripMeta}>Started {trip.startTime ? new Date(trip.startTime).toLocaleTimeString() : "recently"}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 8,
  },
  routeHeader: {
    flexDirection: "row",
    gap: 12,
  },
  routeStripe: {
    borderRadius: 999,
    width: 5,
  },
  routeCopy: {
    flex: 1,
  },
  routeName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  routeFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  count: {
    color: colors.muted,
    fontSize: 13,
  },
  stopRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  stopNumber: {
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  stopNumberText: {
    color: colors.primaryDark,
    fontWeight: "900",
  },
  stopCopy: {
    flex: 1,
  },
  stopName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  tripMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
  },
});
