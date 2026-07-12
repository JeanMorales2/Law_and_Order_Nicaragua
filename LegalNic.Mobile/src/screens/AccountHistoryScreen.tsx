import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../components/Button";
import { StatusPill } from "../components/StatusPill";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { ServiceRequestSummaryResponse } from "../services/api/contracts";
import { getMyServiceRequests } from "../services/api/requests";
import { theme } from "../theme";
import { getStatusLabel, getStatusTone } from "./CitizenRequestsScreen";

type Props = NativeStackScreenProps<RootStackParamList, "AccountHistory">;

export function AccountHistoryScreen({ navigation }: Props) {
  const requestsQuery = useQuery({
    queryKey: ["requests", "mine"],
    queryFn: getMyServiceRequests,
  });

  const history = (requestsQuery.data ?? []).filter(
    (request) => request.status === "Completed" || request.status === "Rejected",
  );

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={history}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          requestsQuery.isLoading ? (
            <SkeletonList />
          ) : requestsQuery.isError ? (
            <ErrorState onRetry={() => void requestsQuery.refetch()} />
          ) : (
            <EmptyState />
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons color={theme.colors.paper} name="chevron-back" size={24} />
            </Pressable>
            <Text style={styles.kicker}>Cuenta</Text>
            <Text style={styles.title}>Historial de tramites</Text>
            <Text style={styles.copy}>Solicitudes finalizadas y rechazadas.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[theme.colors.gold]}
            onRefresh={() => void requestsQuery.refetch()}
            refreshing={requestsQuery.isRefetching}
            tintColor={theme.colors.gold}
          />
        }
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            onPress={() =>
              navigation.navigate("ServiceRequestDetail", {
                requestId: item.id,
              })
            }
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function HistoryCard({ item, onPress }: { item: ServiceRequestSummaryResponse; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <Text style={styles.counterparty}>{item.counterpartyName}</Text>
        </View>
        <StatusPill label={getStatusLabel(item.status)} tone={getStatusTone(item.status)} />
      </View>
      <Text numberOfLines={2} style={styles.caseDetail}>
        {item.caseDetail}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.metaText}>
          {item.completedAt ? `Finalizada ${formatDate(item.completedAt)}` : `Creada ${formatDate(item.createdAt)}`}
        </Text>
        <Ionicons color={theme.colors.navySoft} name="chevron-forward" size={20} />
      </View>
    </Pressable>
  );
}

function SkeletonList() {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 3 }, (_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonWide} />
          <View style={styles.skeletonLine} />
        </View>
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.stateBox}>
      <Ionicons color={theme.colors.gold} name="archive-outline" size={34} />
      <Text style={styles.stateTitle}>No hay tramites cerrados</Text>
      <Text style={styles.stateCopy}>Las solicitudes finalizadas o rechazadas apareceran aqui.</Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.stateBox}>
      <Ionicons color={theme.colors.rojo} name="cloud-offline-outline" size={34} />
      <Text style={styles.stateTitle}>No pudimos cargar el historial</Text>
      <Text style={styles.stateCopy}>Revisa tu conexion e intenta nuevamente.</Text>
      <Button label="Reintentar" onPress={onRetry} variant="dark" />
    </View>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    backgroundColor: theme.colors.navy,
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginBottom: theme.spacing.lg,
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
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.86,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  cardTitleBlock: {
    flex: 1,
  },
  serviceName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
  },
  counterparty: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
    marginTop: theme.spacing.xxs,
  },
  caseDetail: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaText: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  skeletonWrap: {
    gap: theme.spacing.sm,
  },
  skeletonCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  skeletonWide: {
    width: "78%",
    height: 14,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.goldSoft,
  },
  skeletonLine: {
    width: "52%",
    height: 12,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.goldSoft,
  },
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxxl,
  },
  stateTitle: {
    ...theme.typography.h3,
    color: theme.colors.navy,
    textAlign: "center",
  },
  stateCopy: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
    textAlign: "center",
  },
});
