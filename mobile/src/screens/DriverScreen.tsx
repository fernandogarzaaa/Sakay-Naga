import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, api } from "../api/client";
import type { Jeepney, RouteSummary, Trip } from "../api/types";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Notice } from "../components/Notice";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";

type Props = {
  routes: RouteSummary[];
  jeepneys: Jeepney[];
  trips: Trip[];
  onChanged: () => void;
};

export function DriverScreen({ routes, jeepneys, trips, onChanged }: Props) {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(routes[0]?.id ?? null);
  const [selectedJeepneyId, setSelectedJeepneyId] = useState<number | null>(jeepneys[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ title: string; body: string; tone: "info" | "warning" | "danger" } | null>(null);

  const startTrip = async () => {
    if (!selectedRouteId || !selectedJeepneyId) {
      setMessage({ title: "Missing trip details", body: "Select a route and jeepney first.", tone: "warning" });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await api.startDriverTrip({ routeId: selectedRouteId, jeepneyId: selectedJeepneyId });
      setMessage({ title: "Trip started", body: "Your active trip is now visible to riders.", tone: "info" });
      onChanged();
    } catch (error) {
      setMessage({
        title: "Driver action blocked",
        body: explainAuthError(error),
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  };

  const endTrip = async (tripId: number) => {
    setBusy(true);
    setMessage(null);
    try {
      await api.endDriverTrip(tripId);
      setMessage({ title: "Trip ended", body: "The trip has been marked complete.", tone: "info" });
      onChanged();
    } catch (error) {
      setMessage({
        title: "Unable to end trip",
        body: explainAuthError(error),
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Driver" subtitle="Start trips and make your jeepney visible to commuters.">
      {message ? <Notice title={message.title} body={message.body} tone={message.tone} /> : null}

      <Card muted>
        <Text style={styles.cardTitle}>Driver account required</Text>
        <Text style={styles.muted}>
          These actions call authenticated mobile endpoints. A signed-in account with the driver role can start
          and end trips; public rider data remains visible without login.
        </Text>
      </Card>

      <Card>
        <Text style={styles.label}>Route</Text>
        <View style={styles.chipGrid}>
          {routes.map((route) => (
            <Pressable
              key={route.id}
              onPress={() => setSelectedRouteId(route.id)}
              style={[styles.chip, selectedRouteId === route.id ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, selectedRouteId === route.id ? styles.chipTextSelected : null]}>
                {route.code}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>Jeepney</Text>
        {jeepneys.map((jeepney) => {
          const selected = selectedJeepneyId === jeepney.id;
          return (
            <Pressable
              key={jeepney.id}
              onPress={() => setSelectedJeepneyId(jeepney.id)}
              style={[styles.jeepneyRow, selected ? styles.jeepneyRowSelected : null]}
            >
              <View>
                <Text style={styles.plate}>{jeepney.plateNumber}</Text>
                <Text style={styles.muted}>Capacity {jeepney.capacity} seats</Text>
              </View>
              <Text style={styles.selectText}>{selected ? "Selected" : "Use"}</Text>
            </Pressable>
          );
        })}
      </Card>

      <Button disabled={busy} onPress={startTrip}>
        {busy ? "Working..." : "Start trip"}
      </Button>

      <Text style={styles.sectionTitle}>Visible active trips</Text>
      {trips.length === 0 ? (
        <Notice title="No active trips" body="Started trips appear here for riders to inspect and report against." />
      ) : (
        trips.map((trip) => (
          <Card key={trip.id}>
            <Text style={styles.cardTitle}>{trip.route.name}</Text>
            <Text style={styles.muted}>{trip.jeepney.plateNumber}</Text>
            <View style={styles.tripFooter}>
              <Text style={styles.muted}>{trip.status}</Text>
              <Button disabled={busy} variant="danger" onPress={() => endTrip(trip.id)}>
                End
              </Button>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

function explainAuthError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return "Sign in through the production mobile auth flow before using driver mode.";
  }
  if (error instanceof ApiError && error.status === 403) {
    return "Your account does not have the driver role.";
  }
  return error instanceof Error ? error.message : "The backend rejected this driver action.";
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 5,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#F1F5F9",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: "800",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  jeepneyRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    padding: 12,
  },
  jeepneyRowSelected: {
    backgroundColor: "#ECFDF5",
    borderColor: colors.primary,
  },
  plate: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  selectText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 18,
  },
  tripFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
});
