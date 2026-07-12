import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "../components/Button";
import { StatusPill } from "../components/StatusPill";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { ServiceRequestStatus, ServiceRequestSummaryResponse } from "../services/api/contracts";
import {
  acceptServiceRequest,
  completeServiceRequest,
  getReceivedServiceRequests,
  rejectServiceRequest,
} from "../services/api/requests";
import { theme } from "../theme";
import { getStatusLabel, getStatusTone } from "./CitizenRequestsScreen";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const tabs: Array<{ label: string; status: ServiceRequestStatus }> = [
  { label: "Pendiente", status: "Pending" },
  { label: "En proceso", status: "InProgress" },
  { label: "Finalizada", status: "Completed" },
];

const commissionRate = 0.05;

export function LawyerRequestsScreen() {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<ServiceRequestStatus>("Pending");
  const [completeTarget, setCompleteTarget] = useState<ServiceRequestSummaryResponse | null>(null);

  const requestsQuery = useQuery({
    queryKey: ["requests", "received", activeStatus],
    queryFn: () => getReceivedServiceRequests(activeStatus),
  });

  const invalidateRequests = async (requestId?: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["requests", "received"] }),
      queryClient.invalidateQueries({ queryKey: ["requests", "detail", requestId] }),
      queryClient.invalidateQueries({ queryKey: ["commissions", "me"] }),
    ]);
  };

  const acceptMutation = useMutation({
    mutationFn: acceptServiceRequest,
    onSuccess: (response) => invalidateRequests(response.id),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectServiceRequest,
    onSuccess: (response) => invalidateRequests(response.id),
  });

  const completeMutation = useMutation({
    mutationFn: ({ agreedPrice, requestId }: { agreedPrice: number; requestId: number }) =>
      completeServiceRequest(requestId, { agreedPrice }),
    onSuccess: async (response) => {
      setCompleteTarget(null);
      await invalidateRequests(response.id);
    },
  });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Operacion</Text>
          <Text style={styles.title}>Solicitudes</Text>
          <Text style={styles.copy}>Acepta, conversa y finaliza tus tramites con precio claro.</Text>
        </View>

        <View style={styles.tabs}>
          {tabs.map((tab) => {
            const selected = activeStatus === tab.status;
            return (
              <Pressable
                accessibilityRole="button"
                key={tab.status}
                onPress={() => setActiveStatus(tab.status)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {requestsQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.gold} />
        ) : requestsQuery.isError ? (
          <StateBox message="No pudimos cargar las solicitudes." onRetry={() => void requestsQuery.refetch()} />
        ) : requestsQuery.data?.length ? (
          <View style={styles.list}>
            {requestsQuery.data.map((request) => (
              <RequestCard
                accepting={acceptMutation.isPending}
                completing={completeMutation.isPending}
                key={request.id}
                onAccept={() => acceptMutation.mutate(request.id)}
                onChat={() => navigation.navigate("RequestChat", { requestId: request.id })}
                onComplete={() => setCompleteTarget(request)}
                onOpen={() => navigation.navigate("ServiceRequestDetail", { requestId: request.id })}
                onReject={() => rejectMutation.mutate(request.id)}
                rejecting={rejectMutation.isPending}
                request={request}
              />
            ))}
          </View>
        ) : (
          <StateBox message={`No hay solicitudes en estado ${tabs.find((tab) => tab.status === activeStatus)?.label.toLowerCase()}.`} />
        )}
      </ScrollView>

      <CompleteRequestModal
        loading={completeMutation.isPending}
        onCancel={() => setCompleteTarget(null)}
        onConfirm={(agreedPrice) => completeTarget && completeMutation.mutate({ requestId: completeTarget.id, agreedPrice })}
        request={completeTarget}
      />
    </View>
  );
}

function RequestCard({
  accepting,
  completing,
  onAccept,
  onChat,
  onComplete,
  onOpen,
  onReject,
  rejecting,
  request,
}: {
  accepting: boolean;
  completing: boolean;
  onAccept: () => void;
  onChat: () => void;
  onComplete: () => void;
  onOpen: () => void;
  onReject: () => void;
  rejecting: boolean;
  request: ServiceRequestSummaryResponse;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.serviceName}>{request.serviceName}</Text>
          <Text style={styles.clientName}>{request.counterpartyName}</Text>
        </View>
        <StatusPill label={getStatusLabel(request.status)} tone={getStatusTone(request.status)} />
      </View>
      <Text numberOfLines={3} style={styles.caseDetail}>{request.caseDetail}</Text>
      <View style={styles.actions}>
        {request.status === "Pending" ? (
          <>
            <Button label="Aceptar" loading={accepting} onPress={onAccept} variant="dark" />
            <Button label="Rechazar" loading={rejecting} onPress={onReject} variant="danger" />
          </>
        ) : null}
        {request.status === "InProgress" ? (
          <Button label="Marcar como finalizado" loading={completing} onPress={onComplete} variant="primary" />
        ) : null}
        <Button
          label="Chat"
          leftIcon={<Ionicons color={theme.colors.navy} name="chatbubble-ellipses-outline" size={18} />}
          onPress={onChat}
          variant="ghost"
        />
      </View>
    </Pressable>
  );
}

function CompleteRequestModal({
  loading,
  onCancel,
  onConfirm,
  request,
}: {
  loading: boolean;
  onCancel: () => void;
  onConfirm: (agreedPrice: number) => void;
  request: ServiceRequestSummaryResponse | null;
}) {
  const [price, setPrice] = useState("");
  const agreedPrice = Number(price) || 0;
  const commission = useMemo(() => roundCurrency(agreedPrice * commissionRate), [agreedPrice]);
  const net = useMemo(() => roundCurrency(Math.max(agreedPrice - commission, 0)), [agreedPrice, commission]);

  return (
    <Modal animationType="fade" transparent visible={Boolean(request)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Finalizar solicitud</Text>
          <Text style={styles.modalCopy}>Ingresa el precio final cobrado antes de confirmar.</Text>
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
            <Button
              disabled={agreedPrice <= 0}
              label="Confirmar"
              loading={loading}
              onPress={() => onConfirm(agreedPrice)}
              variant="primary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StateBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.stateBox}>
      <Ionicons color={theme.colors.gold} name="briefcase-outline" size={34} />
      <Text style={styles.stateTitle}>{message}</Text>
      {onRetry ? <Button label="Reintentar" onPress={onRetry} variant="dark" /> : null}
    </View>
  );
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-NI", {
    maximumFractionDigits: 2,
  }).format(value);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  content: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.xxxl, paddingBottom: theme.spacing.xxxl },
  header: { marginBottom: theme.spacing.lg },
  kicker: { ...theme.typography.label, color: theme.colors.gold, textTransform: "uppercase" },
  title: { ...theme.typography.h1, color: theme.colors.navy, marginTop: theme.spacing.xs },
  copy: { ...theme.typography.body, color: theme.colors.inkSoft, marginTop: theme.spacing.xs },
  tabs: { flexDirection: "row", gap: theme.spacing.xs, backgroundColor: theme.colors.goldSoft, borderRadius: theme.radii.md, padding: theme.spacing.xxs, marginBottom: theme.spacing.lg },
  tab: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.sm },
  tabSelected: { backgroundColor: theme.colors.white },
  tabText: { ...theme.typography.bodySm, color: theme.colors.inkSoft },
  tabTextSelected: { color: theme.colors.navy, fontFamily: theme.fontFamilies.bodySemiBold },
  list: { gap: theme.spacing.sm },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.md, gap: theme.spacing.sm },
  pressed: { opacity: 0.86 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md },
  cardTitleBlock: { flex: 1 },
  serviceName: { ...theme.typography.bodyMedium, color: theme.colors.navy },
  clientName: { ...theme.typography.bodySm, color: theme.colors.inkSoft, marginTop: theme.spacing.xxs },
  caseDetail: { ...theme.typography.body, color: theme.colors.ink },
  actions: { gap: theme.spacing.sm },
  stateBox: { alignItems: "center", gap: theme.spacing.sm, backgroundColor: theme.colors.white, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.xl },
  stateTitle: { ...theme.typography.h3, color: theme.colors.navy, textAlign: "center" },
  modalOverlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(18, 32, 59, 0.35)", padding: theme.spacing.xl },
  modalCard: { width: "100%", backgroundColor: theme.colors.paper, borderRadius: theme.radii.md, padding: theme.spacing.lg, gap: theme.spacing.sm },
  modalTitle: { ...theme.typography.h2, color: theme.colors.navy },
  modalCopy: { ...theme.typography.body, color: theme.colors.inkSoft },
  modalInput: { ...theme.typography.body, minHeight: 50, color: theme.colors.ink, backgroundColor: theme.colors.white, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: theme.spacing.md },
  commissionBox: { backgroundColor: theme.colors.goldSoft, borderRadius: theme.radii.md, padding: theme.spacing.md, gap: theme.spacing.xs },
  commissionLine: { ...theme.typography.body, color: theme.colors.navy },
  netLine: { ...theme.typography.bodyMedium, color: theme.colors.verde },
  modalActions: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
});
