import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { api } from "./src/api/client";
import { mockCrowding, mockJeepneys, mockRoutes, mockTrips } from "./src/api/mockData";
import type { Crowding, Jeepney, RouteSummary, Trip, User } from "./src/api/types";
import { AccountScreen } from "./src/screens/AccountScreen";
import { DriverScreen } from "./src/screens/DriverScreen";
import { OperatorScreen } from "./src/screens/OperatorScreen";
import { ReportScreen } from "./src/screens/ReportScreen";
import { RiderScreen } from "./src/screens/RiderScreen";
import { colors } from "./src/theme/colors";

type Tab = "rider" | "report" | "driver" | "operator" | "account";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "rider", label: "Ride" },
  { id: "report", label: "Report" },
  { id: "driver", label: "Driver" },
  { id: "operator", label: "Ops" },
  { id: "account", label: "Account" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("rider");
  const [routes, setRoutes] = useState<RouteSummary[]>(mockRoutes);
  const [crowding, setCrowding] = useState<Record<number, Crowding>>(mockCrowding);
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [jeepneys, setJeepneys] = useState<Jeepney[]>(mockJeepneys);
  const [offline, setOffline] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reportRoute, setReportRoute] = useState<RouteSummary | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [liveRoutes, liveTrips, liveJeepneys] = await Promise.all([
        api.routes(),
        api.trips(),
        api.jeepneys(),
      ]);
      const crowdingEntries = await Promise.all(
        liveRoutes.map(async (route) => [route.id, await api.crowding(route.id)] as const),
      );
      setRoutes(liveRoutes);
      setTrips(liveTrips);
      setJeepneys(liveJeepneys);
      setCrowding(Object.fromEntries(crowdingEntries));
      setUser(await api.me().catch(() => null));
      setOffline(false);
    } catch {
      setRoutes(mockRoutes);
      setTrips(mockTrips);
      setJeepneys(mockJeepneys);
      setCrowding(mockCrowding);
      setOffline(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    api.loadSession().finally(refresh);
  }, [refresh]);

  const content = useMemo(() => {
    switch (activeTab) {
      case "report":
        return (
          <ReportScreen
            key={reportRoute?.id ?? "manual"}
            routes={routes}
            jeepneys={jeepneys}
            initialRoute={reportRoute}
            onSubmitted={refresh}
          />
        );
      case "driver":
        return <DriverScreen routes={routes} jeepneys={jeepneys} trips={trips} onChanged={refresh} />;
      case "operator":
        return (
          <OperatorScreen
            routes={routes}
            crowding={crowding}
            trips={trips}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        );
      case "account":
        return <AccountScreen user={user} onUserChanged={setUser} />;
      case "rider":
      default:
        return (
          <RiderScreen
            routes={routes}
            crowding={crowding}
            trips={trips}
            offline={offline}
            refreshing={refreshing}
            onRefresh={refresh}
            onReportRoute={(route) => {
              setReportRoute(route);
              setActiveTab("report");
            }}
          />
        );
    }
  }, [activeTab, crowding, jeepneys, offline, refresh, refreshing, reportRoute, routes, trips, user]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.app}>{content}</View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => {
                if (tab.id !== "report") setReportRoute(null);
                setActiveTab(tab.id);
              }}
              style={[styles.tab, selected ? styles.tabSelected : null]}
            >
              <Text style={[styles.tabText, selected ? styles.tabTextSelected : null]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  app: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    left: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "absolute",
    right: 0,
  },
  tab: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  tabSelected: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  tabTextSelected: {
    color: "#FFFFFF",
  },
});
