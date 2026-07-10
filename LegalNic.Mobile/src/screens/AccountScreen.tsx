import { useMutation } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ScreenHeader } from "../components/ScreenHeader";
import { StatusPill } from "../components/StatusPill";
import { theme } from "../theme";
import { useAuthStore } from "../store/authStore";

export function AccountScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
  });

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.content}>
        <ScreenHeader subtitle="Sesion segura en SecureStore" title="Cuenta" />
        <Card>
          <Text style={styles.name}>{user?.fullName ?? "Sin sesion"}</Text>
          <Text style={styles.meta}>{user?.email ?? ""}</Text>
          <Text style={styles.meta}>{user?.phoneNumber ?? ""}</Text>
          <View style={styles.row}>
            {user?.role ? <StatusPill label={user.role} tone="inProgress" /> : null}
            {user?.isVerified ? <StatusPill label="Verificada" tone="completed" /> : null}
          </View>
          <Button
            label="Cerrar sesion"
            loading={logoutMutation.isPending}
            onPress={() => logoutMutation.mutate()}
            variant="outline"
          />
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
  },
  name: {
    ...theme.typography.h2,
    color: theme.colors.navyDeep,
  },
  meta: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
});
