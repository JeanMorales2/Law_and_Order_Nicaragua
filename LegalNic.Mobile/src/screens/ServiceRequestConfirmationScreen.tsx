import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../components/Button";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "ServiceRequestConfirmation">;

export function ServiceRequestConfirmationScreen({ navigation, route }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.iconWrap}>
        <Ionicons color={theme.colors.verde} name="checkmark-circle" size={54} />
      </View>
      <Text style={styles.kicker}>Solicitud enviada</Text>
      <Text style={styles.title}>Tu expediente fue creado</Text>
      <Text style={styles.copy}>
        La solicitud #{route.params.requestId} quedo registrada. El profesional podra revisarla y responder desde el chat cuando exista conversacion.
      </Text>
      <View style={styles.actions}>
        <Button
          label="Ver mis solicitudes"
          onPress={() =>
            navigation.navigate("App", {
              screen: "CitizenRequests",
            })
          }
          variant="dark"
        />
        <Button
          label="Volver al inicio"
          onPress={() =>
            navigation.navigate("App", {
              screen: "CitizenHome",
            })
          }
          variant="ghost"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: theme.colors.paper,
    paddingHorizontal: theme.spacing.xl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: theme.radii.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(63, 122, 92, 0.12)",
    marginBottom: theme.spacing.xl,
  },
  kicker: {
    ...theme.typography.label,
    color: theme.colors.gold,
    textTransform: "uppercase",
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.navy,
    marginTop: theme.spacing.xs,
  },
  copy: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
    marginTop: theme.spacing.sm,
  },
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
});
