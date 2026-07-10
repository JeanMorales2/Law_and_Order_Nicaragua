import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

type StatusTone = "pending" | "inProgress" | "completed" | "rejected";

type StatusPillProps = {
  label: string;
  tone: StatusTone;
};

const toneMap = {
  pending: {
    backgroundColor: theme.colors.goldSoft,
    textColor: theme.colors.gold,
  },
  inProgress: {
    backgroundColor: theme.colors.overlay,
    textColor: theme.colors.navy,
  },
  completed: {
    backgroundColor: "rgba(63, 122, 92, 0.12)",
    textColor: theme.colors.verde,
  },
  rejected: {
    backgroundColor: "rgba(162, 59, 59, 0.12)",
    textColor: theme.colors.rojo,
  },
} as const;

export function StatusPill({ label, tone }: StatusPillProps) {
  const palette = toneMap[tone];

  return (
    <View style={[styles.base, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.label, { color: palette.textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  label: {
    ...theme.typography.label,
    textTransform: "uppercase",
  },
});
