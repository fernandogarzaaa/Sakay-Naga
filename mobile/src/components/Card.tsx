import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  children: ReactNode;
  muted?: boolean;
};

export function Card({ children, muted }: Props) {
  return <View style={[styles.card, muted ? styles.muted : null]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
  },
});
