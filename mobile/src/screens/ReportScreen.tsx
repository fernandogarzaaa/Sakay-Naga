import * as Location from "expo-location";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError, api } from "../api/client";
import type { CrowdingStatus, Jeepney, RouteSummary } from "../api/types";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Notice } from "../components/Notice";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";

type StatusOption = {
  value: Exclude<CrowdingStatus, "unknown">;
  label: string;
  helper: string;
};

const statusOptions: StatusOption[] = [
  { value: "maluwag", label: "Maluwag", helper: "Many seats available" },
  { value: "may_seats_pa", label: "May seats pa", helper: "A few seats are open" },
  { value: "halos_puno", label: "Halos puno", helper: "Nearly full" },
  { value: "puno_na", label: "Puno na", helper: "No seats left" },
  { value: "unsafe", label: "Unsafe", helper: "Overcrowded or unsafe" },
];

type Props = {
  routes: RouteSummary[];
  jeepneys: Jeepney[];
  initialRoute?: RouteSummary | null;
  onSubmitted: () => void;
};

export function ReportScreen({ routes, jeepneys, initialRoute, onSubmitted }: Props) {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(initialRoute?.id ?? routes[0]?.id ?? null);
  const [selectedStatus, setSelectedStatus] = useState<StatusOption["value"] | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ title: string; body: string; tone: "info" | "warning" | "danger" } | null>(null);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  const submit = async () => {
    if (!selectedRouteId || !selectedStatus) {
      setMessage({
        title: "Missing report details",
        body: "Choose a route and crowding status before submitting.",
        tone: "warning",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    let latitude: number | undefined;
    let longitude: number | undefined;

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status === "granted") {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
    }

    try {
      await api.submitReport({
        routeId: selectedRouteId,
        status: selectedStatus,
        jeepneyQr: qrCode.trim() || undefined,
        jeepneyId: qrCode.trim() ? undefined : jeepneys[0]?.id,
        latitude,
        longitude,
        notes: notes.trim() || undefined,
      });
      setMessage({
        title: "Report submitted",
        body: "Your update is now part of the live crowding signal.",
        tone: "info",
      });
      setSelectedStatus(null);
      setNotes("");
      onSubmitted();
    } catch (error) {
      const authMessage =
        error instanceof ApiError && error.status === 401
          ? "The backend requires a signed-in rider session before accepting live reports. Mobile auth is the next integration step."
          : error instanceof Error
            ? error.message
            : "Unable to submit this report.";
      setMessage({
        title: "Report not sent",
        body: authMessage,
        tone: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title="Report crowding" subtitle="Share live seat availability from a jeepney or route stop.">
      {message ? <Notice title={message.title} body={message.body} tone={message.tone} /> : null}

      <Card>
        <Text style={styles.label}>Route</Text>
        <View style={styles.chipGrid}>
          {routes.map((route) => {
            const selected = route.id === selectedRouteId;
            return (
              <Pressable
                key={route.id}
                onPress={() => setSelectedRouteId(route.id)}
                style={[styles.routeChip, selected ? styles.routeChipSelected : null]}
              >
                <Text style={[styles.routeChipText, selected ? styles.routeChipTextSelected : null]}>{route.code}</Text>
              </Pressable>
            );
          })}
        </View>
        {selectedRoute ? (
          <Text style={styles.routeHint}>{selectedRoute.origin} to {selectedRoute.destination}</Text>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.label}>Jeepney QR or plate hint</Text>
        <TextInput
          value={qrCode}
          onChangeText={setQrCode}
          autoCapitalize="characters"
          placeholder="SKN-JEEP-001"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={styles.help}>Leave blank to use the first known demo jeepney during local development.</Text>
      </Card>

      <Card>
        <Text style={styles.label}>Capacity status</Text>
        {statusOptions.map((option) => {
          const selected = selectedStatus === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setSelectedStatus(option.value)}
              style={[styles.statusOption, selected ? styles.statusOptionSelected : null]}
            >
              <View>
                <Text style={styles.statusLabel}>{option.label}</Text>
                <Text style={styles.help}>{option.helper}</Text>
              </View>
              <Text style={styles.statusMark}>{selected ? "Selected" : "Tap"}</Text>
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional context for other commuters"
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.input, styles.notes]}
        />
      </Card>

      <Button disabled={submitting} onPress={submit}>
        {submitting ? "Submitting..." : "Submit report"}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  routeChip: {
    backgroundColor: "#F1F5F9",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  routeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  routeChipText: {
    color: colors.text,
    fontWeight: "800",
  },
  routeChipTextSelected: {
    color: "#FFFFFF",
  },
  routeHint: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 10,
  },
  input: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  notes: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  help: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  statusOption: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    padding: 12,
  },
  statusOptionSelected: {
    backgroundColor: "#ECFDF5",
    borderColor: colors.primary,
  },
  statusLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  statusMark: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
});
