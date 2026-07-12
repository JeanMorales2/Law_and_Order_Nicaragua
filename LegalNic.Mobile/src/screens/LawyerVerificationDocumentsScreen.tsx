import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../store/authStore";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "LawyerVerificationDocuments">;

export function LawyerVerificationDocumentsScreen({ navigation }: Props) {
  const status = useAuthStore((state) => state.user?.lawyerProfile?.verificationStatus);

  return (
    <View style={styles.screen}>
      <Pressable accessibilityLabel="Volver" accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons color={theme.colors.paper} name="chevron-back" size={24} />
      </Pressable>
      <Text style={styles.kicker}>Verificacion</Text>
      <Text style={styles.title}>Documentos</Text>
      <Text style={styles.copy}>Estado actual: {status ?? "Pendiente"}</Text>
      <View style={styles.card}>
        <Ionicons color={theme.colors.gold} name="document-attach-outline" size={28} />
        <Text style={styles.cardTitle}>Centro de documentos</Text>
        <Text style={styles.cardCopy}>La carga y reemplazo de documentos se conectara al flujo administrativo ya disponible en el backend.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.navy, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxxl },
  backButton: { width: 44, height: 44, borderRadius: theme.radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255, 255, 255, 0.12)", marginBottom: theme.spacing.xl },
  kicker: { ...theme.typography.label, color: theme.colors.gold, textTransform: "uppercase" },
  title: { ...theme.typography.h1, color: theme.colors.paper, marginTop: theme.spacing.xs },
  copy: { ...theme.typography.body, color: theme.colors.goldSoft, marginTop: theme.spacing.sm },
  card: { backgroundColor: theme.colors.paper, borderRadius: theme.radii.md, padding: theme.spacing.lg, gap: theme.spacing.sm, marginTop: theme.spacing.xl },
  cardTitle: { ...theme.typography.h3, color: theme.colors.navy },
  cardCopy: { ...theme.typography.body, color: theme.colors.inkSoft },
});
