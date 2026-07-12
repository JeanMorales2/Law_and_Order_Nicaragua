import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { StatusPill } from "../components/StatusPill";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { ServiceRequestDetailResponse, ServiceRequestStatus } from "../services/api/contracts";
import { getLawyerReviews } from "../services/api/lawyers";
import {
  acceptServiceRequest,
  completeServiceRequest,
  getServiceRequestDetail,
  rejectServiceRequest,
} from "../services/api/requests";
import { useAuthStore } from "../store/authStore";
import { theme } from "../theme";
import { getStatusLabel, getStatusTone } from "./CitizenRequestsScreen";

type Props = NativeStackScreenProps<RootStackParamList, "ServiceRequestDetail">;

export function ServiceRequestDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const requestId = route.params.requestId;
  const role = useAuthStore((state) => state.role);
  const isProfessional = role === "Lawyer" || role === "Student";
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["requests", "detail", requestId],
    queryFn: () => getServiceRequestDetail(requestId),
  });

  const detail = detailQuery.data;

  const reviewsQuery = useQuery({
    enabled: detail?.status === "Completed",
    queryKey: ["lawyers", detail?.lawyerProfileId, "reviews", "request-check"],
    queryFn: () => getLawyerReviews(detail!.lawyerProfileId, 1, 100),
  });

  const hasReview = Boolean(reviewsQuery.data?.items.some((review) => review.serviceRequestId === requestId));
  const canReview = !isProfessional && detail?.status === "Completed" && !hasReview && !reviewsQuery.isLoading;

  const invalidateRequestFlow = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["requests", "detail", requestId] }),
      queryClient.invalidateQueries({ queryKey: ["requests", "mine"] }),
      queryClient.invalidateQueries({ queryKey: ["requests", "received"] }),
      queryClient.invalidateQueries({ queryKey: ["commissions", "me"] }),
    ]);
  };

  const acceptMutation = useMutation({
    mutationFn: () => acceptServiceRequest(requestId),
    onSuccess: invalidateRequestFlow,
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectServiceRequest(requestId),
    onSuccess: invalidateRequestFlow,
  });

  const completeMutation = useMutation({
    mutationFn: (agreedPrice: number) => completeServiceRequest(requestId, { agreedPrice }),
    onSuccess: async () => {
      setCompleteModalOpen(false);
      await invalidateRequestFlow();
    },
  });

  if (detailQuery.isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  if (detailQuery.isError || !detail) {
    return (
      <View style={styles.centerScreen}>
        <Ionicons color={theme.colors.rojo} name="cloud-offline-outline" size={34} />
        <Text style={styles.stateTitle}>No pudimos cargar la solicitud</Text>
        <Text style={styles.stateCopy}>Revisa tu conexion e intenta nuevamente.</Text>
        <Button label="Reintentar" onPress={() => void detailQuery.refetch()} variant="dark" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 132, 160) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="Volver" accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons color={theme.colors.paper} name="chevron-back" size={24} />
          </Pressable>
          <Text style={styles.kicker}>Solicitud #{detail.id}</Text>
          <Text style={styles.title}>{detail.serviceName}</Text>
          <Text style={styles.copy}>{detail.lawyerName}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.statusRow}>
            <StatusPill label={getStatusLabel(detail.status)} tone={getStatusTone(detail.status)} />
            <Text style={styles.dateText}>Creada {formatDate(detail.createdAt)}</Text>
          </View>

          {detail.status === "Rejected" ? <RejectedBanner /> : <Timeline status={detail.status} />}

          <Section title="Detalle del caso">
            <Text style={styles.bodyCopy}>{detail.caseDetail}</Text>
          </Section>

          <Section title="Precio acordado">
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Monto</Text>
              <Text style={styles.priceValue}>
                {typeof detail.agreedPrice === "number" ? `C$ ${formatMoney(detail.agreedPrice)}` : "Pendiente de acuerdo"}
              </Text>
            </View>
          </Section>

          <Section title="Resumen">
            <View style={styles.summaryGrid}>
              <SummaryItem label="Categoria" value={detail.categoryName} />
              <SummaryItem label="Mensajes" value={String(detail.messageCount)} />
              <SummaryItem label="Finalizada" value={detail.completedAt ? formatDate(detail.completedAt) : "-"} />
            </View>
          </Section>
        </View>
      </ScrollView>

      <View style={[styles.fixedBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
        {isProfessional && detail.status === "Pending" ? (
          <>
            <Button label="Aceptar" loading={acceptMutation.isPending} onPress={() => acceptMutation.mutate()} variant="dark" />
            <Button label="Rechazar" loading={rejectMutation.isPending} onPress={() => rejectMutation.mutate()} variant="danger" />
          </>
        ) : null}
        {isProfessional && detail.status === "InProgress" ? (
          <Button label="Marcar como finalizado" onPress={() => setCompleteModalOpen(true)} variant="primary" />
        ) : null}
        {canReview ? (
          <Button
            label="Calificar servicio"
            onPress={() =>
              navigation.navigate("ReviewService", {
                requestId: detail.id,
              })
            }
            variant="primary"
          />
        ) : null}
        <Button
          label="Enviar mensaje"
          leftIcon={<Ionicons color={theme.colors.paper} name="chatbubble-ellipses-outline" size={20} />}
          onPress={() =>
            navigation.navigate("RequestChat", {
              requestId: detail.id,
            })
          }
          variant="dark"
        />
      </View>
      <CompleteModal
        loading={completeMutation.isPending}
        onCancel={() => setCompleteModalOpen(false)}
        onConfirm={(agreedPrice) => completeMutation.mutate(agreedPrice)}
        visible={completeModalOpen}
      />
    </View>
  );
}

function CompleteModal({
  loading,
  onCancel,
  onConfirm,
  visible,
}: {
  loading: boolean;
  onCancel: () => void;
  onConfirm: (agreedPrice: number) => void;
  visible: boolean;
}) {
  const [price, setPrice] = useState("");
  const agreedPrice = Number(price) || 0;
  const commission = useMemo(() => Math.round(agreedPrice * 0.05 * 100) / 100, [agreedPrice]);
  const net = useMemo(() => Math.round(Math.max(agreedPrice - commission, 0) * 100) / 100, [agreedPrice, commission]);

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Finalizar solicitud</Text>
          <Text style={styles.modalCopy}>Confirma el precio final cobrado.</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setPrice}
            placeholder="Precio final"
            placeholderTextColor={theme.colors.inkSoft}
            style={styles.modalInput}
            value={price}
          />
          <View style={styles.commissionBox}>
            <Text style={styles.commissionLine}>Comision LegalNic (5%): C$ {formatMoney(commission)}</Text>
            <Text style={styles.netLine}>Recibes tu: C$ {formatMoney(net)}</Text>
          </View>
          <View style={styles.modalActions}>
            <Button disabled={loading} label="Cancelar" onPress={onCancel} variant="ghost" />
            <Button disabled={agreedPrice <= 0} label="Confirmar" loading={loading} onPress={() => onConfirm(agreedPrice)} variant="primary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Timeline({ status }: { status: ServiceRequestStatus }) {
  const steps: Array<{ key: ServiceRequestStatus; label: string }> = [
    { key: "Pending", label: "Pendiente" },
    { key: "InProgress", label: "En proceso" },
    { key: "Completed", label: "Finalizada" },
  ];
  const activeIndex = Math.max(0, steps.findIndex((step) => step.key === status));

  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => {
        const active = index <= activeIndex;

        return (
          <View key={step.key} style={styles.timelineStep}>
            <View style={[styles.timelineDot, active && styles.timelineDotActive]}>
              {active ? <Ionicons color={theme.colors.paper} name="checkmark" size={14} /> : null}
            </View>
            {index < steps.length - 1 ? <View style={[styles.timelineLine, active && styles.timelineLineActive]} /> : null}
            <Text style={[styles.timelineLabel, active && styles.timelineLabelActive]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function RejectedBanner() {
  return (
    <View style={styles.rejectedBanner}>
      <Ionicons color={theme.colors.rojo} name="alert-circle-outline" size={22} />
      <View style={styles.rejectedCopy}>
        <Text style={styles.rejectedTitle}>Solicitud rechazada</Text>
        <Text style={styles.rejectedText}>Este expediente no continuara con el profesional seleccionado.</Text>
      </View>
    </View>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-NI", {
    maximumFractionDigits: 0,
  }).format(value);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.paper,
    paddingHorizontal: theme.spacing.xl,
  },
  content: {
    backgroundColor: theme.colors.paper,
  },
  header: {
    backgroundColor: theme.colors.navy,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xl,
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
  body: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  dateText: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  timeline: {
    flexDirection: "row",
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  timelineStep: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.line,
    zIndex: 2,
  },
  timelineDotActive: {
    backgroundColor: theme.colors.navy,
  },
  timelineLine: {
    position: "absolute",
    top: 13,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: theme.colors.line,
  },
  timelineLineActive: {
    backgroundColor: theme.colors.navy,
  },
  timelineLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  timelineLabelActive: {
    color: theme.colors.navy,
    fontFamily: theme.fontFamilies.bodySemiBold,
  },
  rejectedBanner: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    backgroundColor: "rgba(162, 59, 59, 0.1)",
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  rejectedCopy: {
    flex: 1,
  },
  rejectedTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.rojo,
  },
  rejectedText: {
    ...theme.typography.bodySm,
    color: theme.colors.rojo,
    marginTop: theme.spacing.xxs,
  },
  section: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.navy,
  },
  bodyCopy: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  priceBox: {
    backgroundColor: theme.colors.goldSoft,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  priceLabel: {
    ...theme.typography.label,
    color: theme.colors.inkSoft,
    textTransform: "uppercase",
  },
  priceValue: {
    ...theme.typography.h3,
    color: theme.colors.navy,
    marginTop: theme.spacing.xxs,
  },
  summaryGrid: {
    gap: theme.spacing.sm,
  },
  summaryItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
  },
  summaryLabel: {
    ...theme.typography.label,
    color: theme.colors.inkSoft,
    textTransform: "uppercase",
  },
  summaryValue: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
    marginTop: theme.spacing.xxs,
  },
  fixedBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
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
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18, 32, 59, 0.35)",
    padding: theme.spacing.xl,
  },
  modalCard: {
    width: "100%",
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.navy,
  },
  modalCopy: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
  modalInput: {
    ...theme.typography.body,
    minHeight: 50,
    color: theme.colors.ink,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingHorizontal: theme.spacing.md,
  },
  commissionBox: {
    backgroundColor: theme.colors.goldSoft,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  commissionLine: {
    ...theme.typography.body,
    color: theme.colors.navy,
  },
  netLine: {
    ...theme.typography.bodyMedium,
    color: theme.colors.verde,
  },
  modalActions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
});
