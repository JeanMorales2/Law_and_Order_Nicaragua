import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

type StarsProps = {
  rating: number;
  total?: number;
};

export function Stars({ rating, total }: StarsProps) {
  const normalized = Math.max(0, Math.min(5, rating));

  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }, (_, index) => {
          const iconName = normalized >= index + 1 ? "star" : "star-outline";

          return <Ionicons color={theme.colors.gold} key={index} name={iconName} size={16} />;
        })}
      </View>
      <Text style={styles.copy}>
        {normalized.toFixed(1)}
        {typeof total === "number" ? ` (${total})` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  copy: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
});
