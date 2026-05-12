import { StyleSheet, Text, View } from "react-native";
import type { CrowdingStatus } from "../api/types";

const statusConfig: Record<CrowdingStatus, { label: string; color: string; background: string }> = {
  maluwag: { label: "Maluwag", color: "#047857", background: "#D1FAE5" },
  may_seats_pa: { label: "May seats pa", color: "#1D4ED8", background: "#DBEAFE" },
  halos_puno: { label: "Halos puno", color: "#A16207", background: "#FEF3C7" },
  puno_na: { label: "Puno na", color: "#C2410C", background: "#FFEDD5" },
  unsafe: { label: "Unsafe", color: "#B91C1C", background: "#FEE2E2" },
  unknown: { label: "No data", color: "#475569", background: "#E2E8F0" },
};

type Props = {
  status: CrowdingStatus;
  confidence?: number;
};

export function StatusPill({ status, confidence }: Props) {
  const config = statusConfig[status] ?? statusConfig.unknown;
  const label = confidence && confidence > 0 ? `${config.label} ${confidence}%` : config.label;

  return (
    <View style={[styles.pill, { backgroundColor: config.background }]}>
      <Text style={[styles.text, { color: config.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
