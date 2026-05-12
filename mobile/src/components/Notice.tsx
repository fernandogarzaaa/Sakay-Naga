import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  title: string;
  body: string;
  tone?: "info" | "warning" | "danger";
};

export function Notice({ title, body, tone = "info" }: Props) {
  return (
    <View style={[styles.notice, styles[tone]]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  info: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  warning: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  danger: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
