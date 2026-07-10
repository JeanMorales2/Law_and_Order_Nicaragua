import { Pressable, StyleSheet, Text } from "react-native";
import { theme } from "../theme";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.idle,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected ? styles.selectedLabel : styles.idleLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  idle: {
    backgroundColor: theme.colors.paper,
    borderColor: theme.colors.line,
  },
  selected: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy,
  },
  pressed: {
    opacity: 0.86,
  },
  label: {
    ...theme.typography.bodySm,
  },
  idleLabel: {
    color: theme.colors.ink,
  },
  selectedLabel: {
    color: theme.colors.paper,
  },
});
