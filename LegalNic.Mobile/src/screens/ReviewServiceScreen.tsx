import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { createRequestReview, getServiceRequestDetail } from "../services/api/requests";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "ReviewService">;

export function ReviewServiceScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const requestId = route.params.requestId;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["requests", "detail", requestId],
    queryFn: () => getServiceRequestDetail(requestId),
  });

  const trimmedComment = comment.trim();
  const commentError = touched && !trimmedComment ? "Escribe un comentario sobre el servicio." : undefined;

  const mutation = useMutation({
    mutationFn: () =>
      createRequestReview(requestId, {
        rating,
        comment: trimmedComment,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["requests", "mine"] }),
        queryClient.invalidateQueries({ queryKey: ["requests", "detail", requestId] }),
        queryClient.invalidateQueries({ queryKey: ["lawyers", detailQuery.data?.lawyerProfileId, "reviews"] }),
      ]);

      navigation.goBack();
    },
  });

  function submit() {
    setTouched(true);

    if (!trimmedComment) {
      return;
    }

    mutation.mutate();
  }

  if (detailQuery.isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <View style={styles.centerScreen}>
        <Ionicons color={theme.colors.rojo} name="cloud-offline-outline" size={34} />
        <Text style={styles.stateTitle}>No pudimos preparar la calificacion</Text>
        <Text style={styles.stateCopy}>Revisa tu conexion e intenta nuevamente.</Text>
        <Button label="Reintentar" onPress={() => void detailQuery.refetch()} variant="dark" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 104, 132) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons color={theme.colors.paper} name="chevron-back" size={24} />
          </Pressable>
          <Text style={styles.kicker}>Calificar servicio</Text>
          <Text style={styles.title}>{detailQuery.data.serviceName}</Text>
          <Text style={styles.copy}>{detailQuery.data.lawyerName}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.ratingBlock}>
            <Text style={styles.label}>Tu calificacion</Text>
            <View style={styles.stars}>
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                const selected = value <= rating;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={value}
                    onPress={() => setRating(value)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      color={theme.colors.gold}
                      name={selected ? "star" : "star-outline"}
                      size={38}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Comentario</Text>
            <TextInput
              multiline
              onBlur={() => setTouched(true)}
              onChangeText={setComment}
              placeholder="Cuéntanos cómo fue tu experiencia."
              placeholderTextColor={theme.colors.inkSoft}
              style={[styles.textArea, commentError && styles.textAreaError]}
              textAlignVertical="top"
              value={comment}
            />
            <View style={styles.helpRow}>
              <Text style={[styles.helpText, commentError && styles.errorText]}>
                {commentError ?? "Tu comentario ayuda a otros ciudadanos."}
              </Text>
              <Text style={styles.helpText}>{trimmedComment.length}/2000</Text>
            </View>
          </View>

          {mutation.isError ? (
            <View style={styles.errorBox}>
              <Ionicons color={theme.colors.rojo} name="alert-circle-outline" size={20} />
              <Text style={styles.errorBoxText}>No pudimos guardar tu calificacion. Intenta nuevamente.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.fixedBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
        <Button
          disabled={mutation.isPending}
          label="Publicar calificacion"
          loading={mutation.isPending}
          onPress={submit}
          variant="primary"
        />
      </View>
    </KeyboardAvoidingView>
  );
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
  form: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  ratingBlock: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.h3,
    color: theme.colors.navy,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  starButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldGroup: {
    gap: theme.spacing.sm,
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
    flex: 1,
  },
  errorText: {
    color: theme.colors.rojo,
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
