import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "../components/Button";
import { StatusPill } from "../components/StatusPill";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { ServiceRequestSummaryResponse } from "../services/api/contracts";
import { getLawyerProfile } from "../services/api/lawyers";
import { getReceivedServiceRequests } from "../services/api/requests";
import { useAuthStore } from "../store/authStore";
import { theme } from "../theme";
import { getStatusLabel, getStatusTone } from "./CitizenRequestsScreen";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function LawyerDashboardScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const profileId = user?.lawyerProfile?.id;
  const verificationStatus = user?.lawyerProfile?.verificationStatus;

  const requestsQuery = useQuery({
    queryKey: ["requests", "received"],
    queryFn: () => getReceivedServiceRequests(),
  });

  const profileQuery = useQuery({
    enabled: Boolean(profileId),
    queryKey: ["lawyers", profileId],
    queryFn: () => getLawyerProfile(profileId!),
  });

  const requests = requestsQuery.data ?? [];
  const pendingCount = requests.filter((request) => request.status === "Pending").length;
  const inProgressCount = requests.filter((request) => request.status === "InProgress").length;
  const recentRequests = requests.slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>LegalNic profesional</Text>
            <Text style={styles.title}>Hola, {getFirstName(user?.fullName)}</Text>
            <Text style={styles.copy}>Gestiona servicios, solicitudes y tu perfil publico.</Text>
          </View>
          {verificationStatus === "Verified" ? (
            <View style={styles.verifiedSeal}>
              <Ionicons color={theme.colors.gold} name="shield-checkmark" size={24} />
            </View>
          ) : null}
        </View>
        {verificationStatus !== "Verified" ? (
          <View style={styles.pendingBanner}>
            <Ionicons color={theme.colors.gold} name="time-outline" size={20} />
            <Text style={styles.pendingText}>
              {verificationStatus === "Rejected"
                ? "Tu verificacion requiere revision. Actualiza tus documentos."
                : "Verificacion pendiente. Algunas funciones pueden depender de la aprobacion."}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Nuevas" loading={requestsQuery.isLoading} value={String(pendingCount)} />
        <StatCard label="En proceso" loading={requestsQuery.isLoading} value={String(inProgressCount)} />
        <StatCard
          label="Calificacion"
          loading={profileQuery.isLoading}
          value={profileQuery.data?.averageRating ? profileQuery.data.averageRating.toFixed(1) : "Nuevo"}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos rapidos</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon="add-circle-outline"
            label="Agregar servicio"
            onPress={() => navigation.navigate("LawyerServiceForm")}
          />
          <QuickAction
            icon="calendar-outline"
            label="Disponibilidad"
            onPress={() => navigation.navigate("LawyerAvailability")}
          />
          <QuickAction
            icon="person-circle-outline"
            label="Vista publica"
            onPress={() => profileId && navigation.navigate("LawyerProfile", { lawyerId: profileId, previewBanner: true })}
          />
          <QuickAction
            icon="star-outline"
            label="Mis reseñas"
            onPress={() => navigation.navigate("LawyerReviews")}
          />
          <QuickAction
            icon="cash-outline"
            label="Ingresos"
            onPress={() => navigation.navigate("LawyerCommissions")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Solicitudes recientes</Text>
          <Text style={styles.countText}>{requests.length} total</Text>
        </View>
        {requestsQuery.isError ? (
          <InlineState
            icon="cloud-offline-outline"
            message="No pudimos cargar tus solicitudes."
            onRetry={() => void requestsQuery.refetch()}
          />
        ) : recentRequests.length ? (
          <View style={styles.requestList}>
            {recentRequests.map((request) => (
              <RecentRequestCard
                key={request.id}
                request={request}
                onPress={() => navigation.navigate("ServiceRequestDetail", { requestId: request.id })}
              />
            ))}
          </View>
        ) : (
          <InlineState icon="briefcase-outline" message="Aun no tienes solicitudes recibidas." />
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, loading, value }: { label: string; loading?: boolean; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{loading ? "..." : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
      <View style={styles.quickIcon}>
        <Ionicons color={theme.colors.navy} name={icon} size={22} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function RecentRequestCard({
  onPress,
  request,
}: {
  onPress: () => void;
  request: ServiceRequestSummaryResponse;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.requestCard, pressed && styles.pressed]}>
      <View style={styles.requestTop}>
        <View style={styles.requestTitleBlock}>
          <Text style={styles.requestTitle}>{request.serviceName}</Text>
          <Text style={styles.requestMeta}>{request.counterpartyName}</Text>
        </View>
        <StatusPill label={getStatusLabel(request.status)} tone={getStatusTone(request.status)} />
      </View>
      <Text numberOfLines={2} style={styles.requestCopy}>
        {request.caseDetail}
      </Text>
    </Pressable>
  );
}

function InlineState({
  icon,
  message,
  onRetry,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.inlineState}>
      <Ionicons color={theme.colors.gold} name={icon} size={24} />
      <Text style={styles.inlineText}>{message}</Text>
      {onRetry ? <Button label="Reintentar" onPress={onRetry} variant="ghost" /> : null}
    </View>
  );
}

function getFirstName(name?: string) {
  return name?.split(" ").filter(Boolean)[0] ?? "profesional";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  content: {
    paddingBottom: theme.spacing.xxxl,
  },
  hero: {
    backgroundColor: theme.colors.navy,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xl,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  heroText: {
    flex: 1,
  },
  kicker: {
    ...theme.typography.label,
    color: theme.colors.gold,
    textTransform: "uppercase",
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.paper,
    marginTop: theme.spacing.xs,
  },
  copy: {
    ...theme.typography.body,
    color: theme.colors.goldSoft,
    marginTop: theme.spacing.xs,
  },
  verifiedSeal: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.navyDeep,
    borderWidth: 1,
    borderColor: theme.colors.navySoft,
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.navyDeep,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  pendingText: {
    ...theme.typography.bodySm,
    color: theme.colors.goldSoft,
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginTop: -theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.navy,
  },
  statLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
    marginTop: theme.spacing.xxs,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.navy,
    marginBottom: theme.spacing.sm,
  },
  countText: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  quickAction: {
    width: "48%",
    minHeight: 92,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    justifyContent: "space-between",
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
  },
  quickLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
  },
  pressed: {
    opacity: 0.86,
  },
  requestList: {
    gap: theme.spacing.sm,
  },
  requestCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  requestTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  requestTitleBlock: {
    flex: 1,
  },
  requestTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
  },
  requestMeta: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
    marginTop: theme.spacing.xxs,
  },
  requestCopy: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  inlineState: {
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.lg,
  },
  inlineText: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
    textAlign: "center",
  },
});
