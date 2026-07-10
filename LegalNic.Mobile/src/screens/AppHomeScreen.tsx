import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { ScreenHeader } from "../components/ScreenHeader";
import { theme } from "../theme";

type AppHomeScreenProps = {
  title: string;
  subtitle: string;
  message: string;
  children?: React.ReactNode;
};

export function AppHomeScreen({ title, subtitle, message, children }: AppHomeScreenProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.content}>
        <ScreenHeader subtitle={subtitle} title={title} />
        {children}
        <Card>
          <Text style={styles.message}>{message}</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.paper,
  },
  message: {
    ...theme.typography.bodyLg,
    color: theme.colors.ink,
  },
});
