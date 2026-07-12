import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusPill } from "../components/StatusPill";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { LawyerCommissionItemResponse, PlatformCommissionStatus } from "../services/api/contracts";
import { getMyCommissions } from "../services/api/commissions";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "LawyerCommissions">;

export function LawyerCommissionsScreen({ navigation }: Props) {
  const commissionsQuery = useQuery({
    queryKey: ["commissions", "me"],
    queryFn: getMyCommissions,
  });

  const account = commissionsQuery.data;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Volver" accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons color={theme.colors.paper} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.kicker}>Estado de cuenta</Text>
        <Text style={styles.title}>Ingresos y comisiones</Text>
        <Text style={styles.copy}>Tus tramites finalizados y comisiones pendientes con LegalNic.</Text>
      </View>

      {commissionsQuery.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.gold} />
        </View>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <SummaryCard label="Total generado" value={`C$ ${formatMoney(account?.totalGenerated ?? 0)}`} />
            <SummaryCard label="Pendiente plataforma" value={`C$ ${formatMoney(account?.totalPending ?? 0)}`} />
          </View>
          <View style={styles.list}>
            {account?.items.length ? (
              account.items.map((item) => <CommissionCard item={item} key={item.id} />)
            ) : (
              <View style={styles.empty}>
                <Ionicons color={theme.colors.gold} name="cash-outline" size={34} />
                <Text style={styles.emptyTitle}>Aun no hay comisiones</Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function CommissionCard({ item }: { item: LawyerCommissionItemResponse }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.titleBlock}>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <Text style={styles.clientName}>{item.clientName}</Text>
        </View>
        <StatusPill label={getCommissionLabel(item.status)} tone={item.status === "Paid" ? "completed" : "pending"} />
      </View>
      <View style={styles.amountGrid}>
        <Amount label="Precio acordado" value={item.agreedPrice} />
        <Amount label="Comision" value={item.commissionAmount} />
        <Amount label="Recibes" value={item.agreedPrice - item.commissionAmount} />
      </View>
    </View>
  );
}

function Amount({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.amountBox}>
      <Text style={styles.amountLabel}>{label}</Text>
      <Text style={styles.amountValue}>C$ {formatMoney(value)}</Text>
    </View>
  );
}

function getCommissionLabel(status: PlatformCommissionStatus) {
  switch (status) {
    case "Paid":
      return "Pagada";
    case "Waived":
      return "Exonerada";
    case "Invoiced":
      return "Facturada";
    case "Pending":
      return "Pendiente";
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-NI", {
    maximumFractionDigits: 2,
  }).format(value);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  content: { paddingBottom: theme.spacing.xxxl },
  header: { backgroundColor: theme.colors.navy, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxxl, paddingBottom: theme.spacing.xl },
  backButton: { width: 44, height: 44, borderRadius: theme.radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255, 255, 255, 0.12)", marginBottom: theme.spacing.lg },
  kicker: { ...theme.typography.label, color: theme.colors.gold, textTransform: "uppercase" },
  title: { ...theme.typography.h1, color: theme.colors.paper, marginTop: theme.spacing.xs },
  copy: { ...theme.typography.body, color: theme.colors.goldSoft, marginTop: theme.spacing.xs },
  loading: { padding: theme.spacing.xl },
  summaryRow: { flexDirection: "row", gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, marginTop: -theme.spacing.lg },
  summaryCard: { flex: 1, backgroundColor: theme.colors.white, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.md },
  summaryValue: { ...theme.typography.h3, color: theme.colors.navy },
  summaryLabel: { ...theme.typography.bodySm, color: theme.colors.inkSoft, marginTop: theme.spacing.xxs },
  list: { padding: theme.spacing.md, gap: theme.spacing.sm },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.md, gap: theme.spacing.sm },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md },
  titleBlock: { flex: 1 },
  serviceName: { ...theme.typography.bodyMedium, color: theme.colors.navy },
  clientName: { ...theme.typography.bodySm, color: theme.colors.inkSoft, marginTop: theme.spacing.xxs },
  amountGrid: { gap: theme.spacing.xs },
  amountBox: { flexDirection: "row", justifyContent: "space-between", backgroundColor: theme.colors.goldSoft, borderRadius: theme.radii.sm, padding: theme.spacing.sm },
  amountLabel: { ...theme.typography.bodySm, color: theme.colors.inkSoft },
  amountValue: { ...theme.typography.bodyMedium, color: theme.colors.navy },
  empty: { alignItems: "center", gap: theme.spacing.sm, backgroundColor: theme.colors.white, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.xl },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.navy },
});
