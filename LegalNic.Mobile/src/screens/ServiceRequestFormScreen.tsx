import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { getLawyerProfile } from "../services/api/lawyers";
import { createServiceRequest } from "../services/api/requests";
import type { PublicLawyerServiceResponse } from "../services/api/contracts";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "ServiceRequestForm">;

const MIN_CASE_DETAIL_LENGTH = 15;

export function ServiceRequestFormScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(route.params.serviceId);
  const [caseDetail, setCaseDetail] = useState("");
  const [touched, setTouched] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["lawyers", route.params.lawyerId],
    queryFn: () => getLawyerProfile(route.params.lawyerId),
  });

  const services = profileQuery.data?.activeServices ?? [];

  useEffect(() => {
    if (!selectedServiceId && services[0]) {
      setSelectedServiceId(services[0].id);
    }
  }, [selectedServiceId, services]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId),
    [selectedServiceId, services],
  );

  const documents = useMemo(
    () => parseRequiredDocuments(selectedService?.requiredDocuments ?? ""),
    [selectedService?.requiredDocuments],
  );

  const trimmedDetail = caseDetail.trim();
  const detailError =
    touched && trimmedDetail.length < MIN_CASE_DETAIL_LENGTH
      ? `Escribe al menos ${MIN_CASE_DETAIL_LENGTH} caracteres sobre tu caso.`
      : undefined;

  const mutation = useMutation({
    mutationFn: () =>
      createServiceRequest({
        serviceId: selectedServiceId ?? 0,
        caseDetail: trimmedDetail,
      }),
    onSuccess: (response) => {
      navigation.replace("ServiceRequestConfirmation", {
        requestId: response.id,
      });
    },
  });

  function submit() {
    setTouched(true);

    if (!selectedServiceId || trimmedDetail.length < MIN_CASE_DETAIL_LENGTH) {
      return;
    }

    mutation.mutate();
  }

  if (profileQuery.isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <View style={styles.centerScreen}>
        <Ionicons color={theme.colors.rojo} name="cloud-offline-outline" size={34} />
        <Text style={styles.stateTitle}>No pudimos preparar la solicitud</Text>
        <Text style={styles.stateCopy}>Revisa tu conexion e intenta nuevamente.</Text>
        <Button label="Reintentar" onPress={() => void profileQuery.refetch()} variant="dark" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 104, 132) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons color={theme.colors.paper} name="chevron-back" size={24} />
          </Pressable>
          <Text style={styles.kicker}>Nuevo expediente</Text>
          <Text style={styles.title}>Solicitar servicio</Text>
          <Text style={styles.copy}>{profileQuery.data.fullName}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Servicio</Text>
            <View style={styles.serviceList}>
              {services.map((service) => (
                <ServiceOption
                  key={service.id}
                  onPress={() => setSelectedServiceId(service.id)}
                  selected={selectedServiceId === service.id}
                  service={service}
                />
              ))}
            </View>
          </View>

          <View style={styles.readOnlyGrid}>
            <ReadOnlyBox label="Precio" value={selectedService ? `C$ ${formatMoney(selectedService.price)}` : "-"} />
            <ReadOnlyBox label="Tiempo" value={selectedService ? `${selectedService.estimatedDays} dias` : "-"} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Detalle del caso</Text>
            <TextInput
              multiline
              onBlur={() => setTouched(true)}
              onChangeText={setCaseDetail}
              placeholder="Describe que necesitas, fechas importantes y cualquier detalle que ayude al profesional."
              placeholderTextColor={theme.colors.inkSoft}
              style={[styles.textArea, detailError && styles.textAreaError]}
              textAlignVertical="top"
              value={caseDetail}
            />
            <View style={styles.helpRow}>
              <Text style={[styles.helpText, detailError && styles.errorText]}>
                {detailError ?? "Minimo 15 caracteres."}
              </Text>
              <Text style={styles.helpText}>{trimmedDetail.length}/4000</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Documentos requeridos</Text>
            <View style={styles.documentChips}>
              {documents.length ? (
                documents.map((document) => (
                  <View key={document} style={styles.documentChip}>
                    <Ionicons color={theme.colors.navy} name="document-text-outline" size={15} />
                    <Text style={styles.documentChipText}>{document}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.bodyCopy}>El profesional no especifico documentos requeridos.</Text>
              )}
            </View>
          </View>

          {mutation.isError ? (
            <View style={styles.errorBox}>
              <Ionicons color={theme.colors.rojo} name="alert-circle-outline" size={20} />
              <Text style={styles.errorBoxText}>No pudimos enviar la solicitud. Intenta nuevamente.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.fixedBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
        <Button
          disabled={!selectedServiceId || mutation.isPending}
          label="Enviar solicitud"
          loading={mutation.isPending}
          onPress={submit}
          variant="primary"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function ServiceOption({
  onPress,
  selected,
  service,
}: {
  onPress: () => void;
  selected: boolean;
  service: PublicLawyerServiceResponse;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.serviceOption,
        selected && styles.serviceOptionSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.optionTop}>
        <Text style={[styles.optionName, selected && styles.optionNameSelected]}>{service.name}</Text>
        {selected ? <Ionicons color={theme.colors.gold} name="checkmark-circle" size={20} /> : null}
      </View>
      <Text style={[styles.optionCategory, selected && styles.optionCategorySelected]}>{service.categoryName}</Text>
    </Pressable>
  );
}

function ReadOnlyBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readOnlyBox}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text style={styles.readOnlyValue}>{value}</Text>
    </View>
  );
}

function parseRequiredDocuments(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
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
    marginTop: theme.spacing.xxs,
  },
  copy: {
    ...theme.typography.body,
    color: theme.colors.goldSoft,
    marginTop: theme.spacing.xs,
  },
  form: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.h3,
    color: theme.colors.navy,
  },
  serviceList: {
    gap: theme.spacing.sm,
  },
  serviceOption: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  serviceOptionSelected: {
    borderColor: theme.colors.navy,
    backgroundColor: theme.colors.navy,
  },
  pressed: {
    opacity: 0.86,
  },
  optionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  optionName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
    flex: 1,
  },
  optionNameSelected: {
    color: theme.colors.paper,
  },
  optionCategory: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  optionCategorySelected: {
    color: theme.colors.goldSoft,
  },
  readOnlyGrid: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  readOnlyBox: {
    flex: 1,
    backgroundColor: theme.colors.goldSoft,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  readOnlyLabel: {
    ...theme.typography.label,
    color: theme.colors.inkSoft,
    textTransform: "uppercase",
  },
  readOnlyValue: {
    ...theme.typography.h3,
    color: theme.colors.navy,
    marginTop: theme.spacing.xxs,
  },
  textArea: {
    ...theme.typography.body,
    minHeight: 150,
    color: theme.colors.ink,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
  },
  textAreaError: {
    borderColor: theme.colors.rojo,
  },
  helpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  helpText: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  errorText: {
    color: theme.colors.rojo,
  },
  documentChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  documentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    backgroundColor: theme.colors.goldSoft,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  documentChipText: {
    ...theme.typography.bodySm,
    color: theme.colors.navy,
  },
  bodyCopy: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: "rgba(162, 59, 59, 0.1)",
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  errorBoxText: {
    ...theme.typography.bodySm,
    color: theme.colors.rojo,
    flex: 1,
  },
  fixedBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
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
});
