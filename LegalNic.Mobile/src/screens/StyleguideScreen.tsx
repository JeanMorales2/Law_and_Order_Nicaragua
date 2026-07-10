import { useState } from "react";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { BottomTabBar } from "../components/BottomTabBar";
import { Input } from "../components/Input";
import { ScreenHeader } from "../components/ScreenHeader";
import { Stars } from "../components/Stars";
import { StatusPill } from "../components/StatusPill";
import { useUiStore } from "../store/uiStore";
import { theme } from "../theme";

const demoTabs = [
  { key: "inicio", label: "Inicio", icon: "home-outline" },
  { key: "casos", label: "Casos", icon: "briefcase-outline" },
  { key: "perfil", label: "Perfil", icon: "person-outline" },
] as const;

export function StyleguideScreen() {
  const [notes, setNotes] = useState("");
  const { demoChip, demoTab, setDemoChip, setDemoTab } = useUiStore();

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="LegalNic"
          subtitle="Styleguide inicial para revisar diseño y componentes."
          rightSlot={
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>Expo</Text>
            </View>
          }
        />

        <Card>
          <Text style={styles.kicker}>Vista de referencia</Text>
          <Text style={styles.heroTitle}>Confianza legal con presencia editorial y tonos sobrios.</Text>
          <Text style={styles.heroBody}>
            Esta pantalla no conecta datos reales todavia. Sirve para validar tipografia, color, jerarquia y
            componentes base antes de enchufar flujos por rol.
          </Text>
          <View style={styles.heroMeta}>
            <StatusPill label="Pendiente" tone="pending" />
            <Stars rating={4.8} total={124} />
          </View>
        </Card>

        <Section title="Botones">
          <View style={styles.buttonGrid}>
            <Button label="Primario" variant="primary" />
            <Button label="Oscuro" variant="dark" />
            <Button label="Outline" variant="outline" />
            <Button label="Peligro" variant="danger" />
            <Button
              label="Ghost"
              leftIcon={<Ionicons color={theme.colors.navy} name="sparkles-outline" size={16} />}
              variant="ghost"
            />
          </View>
        </Section>

        <Section title="Encabezados">
          <Card>
            <ScreenHeader showBackButton subtitle="Con accion de regreso." title="Detalle de solicitud" />
          </Card>
        </Section>

        <Section title="Estados y filtros">
          <View style={styles.rowWrap}>
            <StatusPill label="Pendiente" tone="pending" />
            <StatusPill label="En curso" tone="inProgress" />
            <StatusPill label="Completada" tone="completed" />
            <StatusPill label="Rechazada" tone="rejected" />
          </View>
          <View style={styles.rowWrap}>
            <Chip label="Online" onPress={() => setDemoChip("online")} selected={demoChip === "online"} />
            <Chip label="Premium" onPress={() => setDemoChip("premium")} selected={demoChip === "premium"} />
            <Chip label="Managua" onPress={() => setDemoChip("managua")} selected={demoChip === "managua"} />
          </View>
        </Section>

        <Section title="Formulario">
          <Card>
            <Input hint="Ejemplo de campo textual reutilizable." label="Asunto legal" placeholder="Describe el caso" />
            <Input
              error={notes.length > 120 ? "No exceder 120 caracteres." : undefined}
              label="Notas internas"
              multiline
              numberOfLines={4}
              onChangeText={setNotes}
              placeholder="Observaciones para el abogado"
              style={styles.multiline}
              textAlignVertical="top"
              value={notes}
            />
          </Card>
        </Section>

        <Section title="Card de abogado">
          <Card>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>AL</Text>
              </View>
              <View style={styles.profileCopy}>
                <Text style={styles.profileName}>Ana Lopez</Text>
                <Text style={styles.profileMeta}>Derecho civil y familia</Text>
                <Stars rating={4.9} total={87} />
              </View>
              <StatusPill label="Verificada" tone="completed" />
            </View>
            <Text style={styles.cardCopy}>
              Disponibilidad clara, tono institucional y bloques de informacion faciles de escanear en movil.
            </Text>
            <Button label="Solicitar asesoria" variant="dark" />
          </Card>
        </Section>

        <Section title="Bottom tab bar">
          <BottomTabBar
            activeKey={demoTab}
            items={demoTabs.map((tab) => ({ ...tab }))}
            onSelect={(key) => setDemoTab(key as "inicio" | "casos" | "perfil")}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
    backgroundColor: theme.colors.paper,
  },
  headerBadge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: theme.colors.goldSoft,
  },
  headerBadgeText: {
    ...theme.typography.label,
    color: theme.colors.gold,
  },
  kicker: {
    ...theme.typography.label,
    color: theme.colors.gold,
    textTransform: "uppercase",
  },
  heroTitle: {
    ...theme.typography.display,
    color: theme.colors.navyDeep,
  },
  heroBody: {
    ...theme.typography.bodyLg,
    color: theme.colors.inkSoft,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.navy,
  },
  sectionBody: {
    gap: theme.spacing.md,
  },
  buttonGrid: {
    gap: theme.spacing.sm,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  multiline: {
    minHeight: 120,
    paddingTop: theme.spacing.md,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.navySoft,
  },
  avatarText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.paper,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...theme.typography.h3,
    color: theme.colors.navyDeep,
  },
  profileMeta: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  cardCopy: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
});
