import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

export type BottomTabItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type BottomTabBarProps = {
  items: BottomTabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
};

export function BottomTabBar({ items, activeKey, onSelect }: BottomTabBarProps) {
  return (
    <View style={styles.shell}>
      {items.map((item) => {
        const active = item.key === activeKey;

        return (
          <Pressable
            accessibilityRole="button"
            key={item.key}
            onPress={() => onSelect(item.key)}
            style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.itemPressed]}
          >
            <Ionicons color={active ? theme.colors.gold : theme.colors.inkSoft} name={item.icon} size={18} />
            <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    backgroundColor: theme.colors.navyDeep,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  item: {
    flex: 1,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  itemActive: {
    backgroundColor: theme.colors.navy,
  },
  itemPressed: {
    opacity: 0.82,
  },
  label: {
    ...theme.typography.bodySm,
  },
  labelActive: {
    color: theme.colors.paper,
  },
  labelIdle: {
    color: theme.colors.inkSoft,
  },
});
