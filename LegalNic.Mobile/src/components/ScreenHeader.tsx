import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightSlot?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightSlot,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.leading}>
          {showBackButton ? (
            <Pressable accessibilityLabel="Volver" accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
              <Ionicons color={theme.colors.navy} name="arrow-back" size={20} />
            </Pressable>
          ) : null}
          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {rightSlot}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.navyDeep,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
});
