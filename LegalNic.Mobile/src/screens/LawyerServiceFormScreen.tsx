import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "../components/Button";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { getCategories } from "../services/api/categories";
import type { CategoryResponse, PriceType, UpsertServiceRequest } from "../services/api/contracts";
import { createMyService, getMyServices, updateMyService } from "../services/api/services";
import { useAuthStore } from "../store/authStore";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "LawyerServiceForm">;

const priceTypes: Array<{ label: string; value: PriceType }> = [
  { label: "Fijo", value: "Fixed" },
  { label: "Rango", value: "Range" },
  { label: "Por hora", value: "Hourly" },
];

export function LawyerServiceFormScreen({ navigation, route }: Props) {
  const serviceId = route.params?.serviceId;
  const editing = typeof serviceId === "number";
  const queryClient = useQueryClient();
  const profileId = useAuthStore((state) => state.user?.lawyerProfile?.id);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [requiredDocuments, setRequiredDocuments] = useState("Documento de identidad");
  const [priceType, setPriceType] = useState<PriceType>("Fixed");
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const servicesQuery = useQuery({
    queryKey: ["services", "mine"],
    queryFn: getMyServices,
  });

  const categories = useMemo(() => flattenCategories(categoriesQuery.data ?? []), [categoriesQuery.data]);
  const service = servicesQuery.data?.find((item) => item.id === serviceId);

  useEffect(() => {
    if (service) {
      setCategoryId(service.categoryId);
      setName(service.name);
      setDescription(service.description);
      setPrice(String(service.price));
      setEstimatedDays(String(service.estimatedDays));
      setRequiredDocuments(service.requiredDocuments);
      setPriceType(service.priceType);
    }
  }, [service]);

  useEffect(() => {
    if (!categoryId && categories[0]) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const request = buildRequest();
      return editing ? updateMyService(serviceId!, request) : createMyService(request);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["services", "mine"] }),
        queryClient.invalidateQueries({ queryKey: ["lawyers", profileId] }),
        queryClient.invalidateQueries({ queryKey: ["services", "search"] }),
      ]);
      navigation.goBack();
    },
    onError: () => {
      setFormMessage("No pudimos guardar el servicio. Revisa los campos e intenta nuevamente.");
    },
  });

  function buildRequest(): UpsertServiceRequest {
    return {
      categoryId: categoryId ?? 0,
      name: name.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      priceType,
      estimatedDays: Number(estimatedDays) || 0,
      requiredDocuments: requiredDocuments.trim() || "Documento de identidad",
      isActive: true,
    };
  }

  function submit() {
    setFormMessage(null);

    if (!categoryId || !name.trim() || !description.trim() || !price.trim() || !estimatedDays.trim()) {
      setFormMessage("Completa nombre, categoria, precio, tiempo y descripcion.");
      return;
    }

    saveMutation.mutate();
  }

  if (editing && servicesQuery.isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons color={theme.colors.paper} name="chevron-back" size={24} />
          </Pressable>
          <Text style={styles.kicker}>{editing ? "Editar catalogo" : "Nuevo servicio"}</Text>
          <Text style={styles.title}>{editing ? "Editar servicio" : "Agregar servicio"}</Text>
          <Text style={styles.copy}>Los cambios se reflejan en tu perfil publico al guardar.</Text>
        </View>

        <View style={styles.form}>
          <Field label="Nombre">
            <TextInput
              onChangeText={setName}
              placeholder="Ej. Asesoria legal inicial"
              placeholderTextColor={theme.colors.inkSoft}
              style={styles.input}
              value={name}
            />
          </Field>

          <Field label="Categoria">
            {categoriesQuery.isLoading ? (
              <ActivityIndicator color={theme.colors.gold} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {categories.map((category) => (
                  <Pressable
                    accessibilityRole="button"
                    key={category.id}
                    onPress={() => setCategoryId(category.id)}
                    style={[styles.chip, categoryId === category.id && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, categoryId === category.id && styles.chipTextSelected]}>{category.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Field>

          <View style={styles.twoColumns}>
            <Field label="Precio">
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setPrice}
                placeholder="0"
                placeholderTextColor={theme.colors.inkSoft}
                style={styles.input}
                value={price}
              />
            </Field>
            <Field label="Dias estimados">
              <TextInput
                keyboardType="number-pad"
                onChangeText={setEstimatedDays}
                placeholder="1"
                placeholderTextColor={theme.colors.inkSoft}
                style={styles.input}
                value={estimatedDays}
              />
            </Field>
          </View>

          <Field label="Tipo de precio">
            <View style={styles.segmented}>
              {priceTypes.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.value}
                  onPress={() => setPriceType(item.value)}
                  style={[styles.segment, priceType === item.value && styles.segmentSelected]}
                >
                  <Text style={[styles.segmentText, priceType === item.value && styles.segmentTextSelected]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="Descripcion">
            <TextInput
              multiline
              onChangeText={setDescription}
              placeholder="Describe el alcance del servicio."
              placeholderTextColor={theme.colors.inkSoft}
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={description}
            />
          </Field>

          <Field label="Documentos requeridos">
            <TextInput
              multiline
              onChangeText={setRequiredDocuments}
              placeholder="Documento de identidad, copia de escritura..."
              placeholderTextColor={theme.colors.inkSoft}
              style={[styles.input, styles.documentsArea]}
              textAlignVertical="top"
              value={requiredDocuments}
            />
          </Field>

          {formMessage ? <Text style={styles.errorText}>{formMessage}</Text> : null}

          <Button
            label={editing ? "Guardar cambios" : "Crear servicio"}
            loading={saveMutation.isPending}
            onPress={submit}
            variant="primary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function flattenCategories(categories: CategoryResponse[]): CategoryResponse[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.subcategories ?? [])]);
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
    backgroundColor: theme.colors.paper,
  },
  content: {
    paddingBottom: theme.spacing.xxxl,
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
  form: {
    padding: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  field: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.inkSoft,
    textTransform: "uppercase",
  },
  input: {
    ...theme.typography.body,
    minHeight: 50,
    color: theme.colors.ink,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingHorizontal: theme.spacing.md,
  },
  textArea: {
    minHeight: 130,
    paddingTop: theme.spacing.md,
  },
  documentsArea: {
    minHeight: 92,
    paddingTop: theme.spacing.md,
  },
  chipRow: {
    gap: theme.spacing.xs,
  },
  chip: {
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy,
  },
  chipText: {
    ...theme.typography.bodySm,
    color: theme.colors.ink,
  },
  chipTextSelected: {
    color: theme.colors.paper,
  },
  twoColumns: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  segmented: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.goldSoft,
    borderRadius: theme.radii.md,
    padding: theme.spacing.xxs,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: theme.radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentSelected: {
    backgroundColor: theme.colors.white,
  },
  segmentText: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  segmentTextSelected: {
    color: theme.colors.navy,
    fontFamily: theme.fontFamilies.bodySemiBold,
  },
  errorText: {
    ...theme.typography.bodySm,
    color: theme.colors.rojo,
  },
});
