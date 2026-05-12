import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ApiError, api } from "../api/client";
import type { Crowding, OperatorDashboard, RouteSummary, Trip } from "../api/types";
import { Card } from "../components/Card";
import { Notice } from "../components/Notice";
import { Screen } from "../components/Screen";
import { StatusPill } from "../components/StatusPill";
import { colors } from "../theme/colors";

type Props = {
  routes: RouteSummary[];
  crowding: Record<number, Crowding>;
  trips: Trip[];
  refreshing: boolean;
  onRefresh: () => void;
};

export function OperatorScreen({ routes, crowding, trips, refreshing, onRefresh }: Props) {
  const [dashboard, setDashboard] = useState<OperatorDashboard | null>(null);
  const [message, setMessage] = useState<{ title: string; body: string; tone: "info" | "warning" | "danger" } | null>(null);

  useEffect(() => {
    api
      .operatorDashboard()
      .then((result) => {
        setDashboard(result);
        setMessage(null);
      })
      .catch((error) => {
        setMessage({
          title: "Operator auth required",
          body:
            error instanceof ApiError && (error.status === 401 || error.status === 403)
              ? "Live operator metrics require an operator or admin session. Public route signals are shown below."
              : error instanceof Error
                ? error.message
                : "Unable to load operator dashboard.",
          tone: "warning",
        });
      });
  }, []);

  const stats = dashboard?.stats ?? {
    totalRoutes: routes.length,
    activeTrips: trips.length,
    totalReports: Object.values(crowding).reduce((sum, item) => sum + item.count, 0),
    totalJeepneys: 0,
    recentReportsCount: Object.values(crowding).reduce((sum, item) => sum + item.count, 0),
    statusDistribution: {},
  };

  return (
    <Screen
      title="Operator"
      subtitle="Monitor route activity, unsafe reports, and active fleet coverage."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {message ? <Notice title={message.title} body={message.body} tone={message.tone} /> : null}

      <View style={styles.grid}>
        <MetricCard label="Routes" value={stats.totalRoutes} />
        <MetricCard label="Active trips" value={stats.activeTrips} />
        <MetricCard label="Reports" value={stats.totalReports} />
        <MetricCard label="Fleet" value={stats.totalJeepneys} />
      </View>

      <Text style={styles.sectionTitle}>Route crowding</Text>
      {routes.map((route) => {
        const status = crowding[route.id] ?? { status: "unknown", confidence: 0, count: 0 };
        return (
          <Card key={route.id}>
            <View style={styles.routeRow}>
              <View style={styles.routeCopy}>
                <Text style={styles.routeName}>{route.name}</Text>
                <Text style={styles.muted}>{status.count} recent reports</Text>
              </View>
              <StatusPill status={status.status} confidence={status.confidence} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  metric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: "47%",
    padding: 14,
  },
  metricValue: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 8,
  },
  routeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  routeCopy: {
    flex: 1,
    paddingRight: 10,
  },
  routeName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
  },
});
