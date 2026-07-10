import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <Text style={styles.wordmark}>LegalNic</Text>
        <View style={styles.rule} />
        <Text style={styles.caption}>La ley y el orden, en una experiencia movil clara.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.navy,
    padding: theme.spacing.xl,
  },
  mark: {
    alignItems: "center",
    gap: theme.spacing.md,
  },
  wordmark: {
    ...theme.typography.display,
    fontSize: 42,
    lineHeight: 48,
    color: theme.colors.paper,
  },
  rule: {
    width: 72,
    height: 3,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.gold,
  },
  caption: {
    ...theme.typography.body,
    color: theme.colors.goldSoft,
    textAlign: "center",
    maxWidth: 260,
  },
});
