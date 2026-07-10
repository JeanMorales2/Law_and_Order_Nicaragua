import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import { StatusPill } from "./StatusPill";

type VerificationBannerProps = {
  status: "Pending" | "Rejected";
};

const copyByStatus = {
  Pending: {
    title: "Verificacion pendiente",
    body: "Tu perfil sigue en revision. Puedes usar la app, pero el distintivo verificado aparecera cuando el equipo apruebe tus documentos.",
    pill: "Pendiente",
  },
  Rejected: {
    title: "Verificacion rechazada",
    body: "Tu documentacion necesita ajustes. Puedes seguir navegando, pero conviene volver a cargar tus soportes desde tu perfil.",
    pill: "Rechazada",
  },
} as const;

export function VerificationBanner({ status }: VerificationBannerProps) {
  const content = copyByStatus[status];

  return (
    <View style={styles.banner}>
      <StatusPill label={content.pill} tone={status === "Pending" ? "pending" : "rejected"} />
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.body}>{content.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.goldSoft,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.navyDeep,
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
});
