import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "../components/Button";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { OwnedServiceResponse } from "../services/api/contracts";
import { deleteMyService, getMyServices } from "../services/api/services";
import { useAuthStore } from "../store/authStore";
import { theme } from "../theme";
import { useState } from "react";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function LawyerServicesScreen() {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const profileId = useAuthStore((state) => state.user?.lawyerProfile?.id);
  const [serviceToDelete, setServiceToDelete] = useState<OwnedServiceResponse | null>(null);

  const servicesQuery = useQuery({
    queryKey: ["services", "mine"],
    queryFn: getMyServices,
  });

  const deleteMutation = useMutation({
    mutationFn: (serviceId: number) => deleteMyService(serviceId),
    onSuccess: async () => {
      setServiceToDelete(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["services", "mine"] }),
        queryClient.invalidateQueries({ queryKey: ["lawyers", profileId] }),
        queryClient.invalidateQueries({ queryKey: ["services", "search"] }),
      ]);
    },
  });

  const activeServices = (servicesQuery.data ?? []).filter((service) => service.isActive);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Catalogo profesional</Text>
            <Text style={styles.title}>Servicios</Text>
            <Text style={styles.copy}>Administra los servicios visibles en tu perfil publico.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("LawyerServiceForm")}
            style={styles.addButton}
          >
            <Ionicons color={theme.colors.navy} name="add" size={24} />
          </Pressable>
        </View>

        {servicesQuery.isLoading ? (
          <SkeletonList />
        ) : servicesQuery.isError ? (
          <StateBox
            icon="cloud-offline-outline"
            message="No pudimos cargar tus servicios."
            onRetry={() => void servicesQuery.refetch()}
          />
        ) : activeServices.length ? (
          <View style={styles.list}>
            {activeServices.map((service) => (
              <ServiceCard
                key={service.id}
                onDelete={() => setServiceToDelete(service)}
                onEdit={() => navigation.navigate("LawyerServiceForm", { serviceId: service.id })}
                service={service}
              />
            ))}
          </View>
        ) : (
          <StateBox icon="layers-outline" message="Aun no tienes servicios activos." />
        )}
      </ScrollView>

      <DeleteServiceModal
        loading={deleteMutation.isPending}
        onCancel={() => setServiceToDelete(null)}
        onConfirm={() => serviceToDelete && deleteMutation.mutate(serviceToDelete.id)}
        service={serviceToDelete}
      />
    </View>
  );
}

function ServiceCard({
  onDelete,
  onEdit,
  service,
}: {
  onDelete: () => void;
  onEdit: () => void;
  service: OwnedServiceResponse;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.category}>{service.categoryName}</Text>
        </View>
        <Text style={styles.price}>C$ {formatMoney(service.price)}</Text>
      </View>
      <Text numberOfLines={2} style={styles.description}>
        {service.description}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons color={theme.colors.inkSoft} name="time-outline" size={15} />
          <Text style={styles.metaText}>{service.estimatedDays} dias</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons color={theme.colors.inkSoft} name="document-text-outline" size={15} />
          <Text numberOfLines={1} style={styles.metaText}>
            {service.requiredDocuments}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="Editar" onPress={onEdit} variant="ghost" />
        <Button label="Eliminar" onPress={onDelete} variant="danger" />
      </View>
    </View>
  );
}

function DeleteServiceModal({
  loading,
  onCancel,
  onConfirm,
  service,
}: {
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  service: OwnedServiceResponse | null;
}) {
  return (
    <Modal animationType="fade" transparent visible={Boolean(service)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIcon}>
            <Ionicons color={theme.colors.rojo} name="trash-outline" size={24} />
          </View>
          <Text style={styles.modalTitle}>Eliminar servicio</Text>
          <Text style={styles.modalCopy}>
            {service ? `¿Quieres eliminar "${service.name}" de tu perfil publico?` : ""}
          </Text>
          <View style={styles.modalActions}>
            <Button disabled={loading} label="Cancelar" onPress={onCancel} variant="ghost" />
            <Button label="Eliminar" loading={loading} onPress={onConfirm} variant="danger" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SkeletonList() {
  return (
    <View style={styles.list}>
      {Array.from({ length: 3 }, (_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonWide} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonShort} />
        </View>
      ))}
    </View>
  );
}

function StateBox({
  icon,
  message,
  onRetry,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.stateBox}>
      <Ionicons color={theme.colors.gold} name={icon} size={34} />
      <Text style={styles.stateTitle}>{message}</Text>
      {onRetry ? <Button label="Reintentar" onPress={onRetry} variant="dark" /> : null}
    </View>
  );
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
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
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
    marginTop: theme.spacing.xs,
    maxWidth: 280,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
  },
  list: {
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
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
  category: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
    marginTop: theme.spacing.xxs,
  },
  price: {
    ...theme.typography.bodyMedium,
    color: theme.colors.verde,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    maxWidth: "100%",
  },
  metaText: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  actions: {
    flexDirection: "row",
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
    width: "84%",
    height: 14,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.goldSoft,
  },
  skeletonLine: {
    width: "64%",
    height: 12,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.goldSoft,
  },
  skeletonShort: {
    width: "38%",
    height: 12,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.goldSoft,
  },
  stateBox: {
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.xl,
  },
  stateTitle: {
    ...theme.typography.h3,
    color: theme.colors.navy,
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
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(162, 59, 59, 0.12)",
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.navy,
  },
  modalCopy: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
  modalActions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
});
