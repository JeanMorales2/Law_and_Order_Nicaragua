import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Stars } from "../components/Stars";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { getLawyerProfile, getLawyerReviews } from "../services/api/lawyers";
import type {
  LawyerReviewItemResponse,
  PublicLawyerProfileResponse,
  PublicLawyerServiceResponse,
} from "../services/api/contracts";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "LawyerProfile">;

export function LawyerProfileScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const lawyerId = route.params.lawyerId;

  const profileQuery = useQuery({
    queryKey: ["lawyers", lawyerId],
    queryFn: () => getLawyerProfile(lawyerId),
  });

  const reviewsQuery = useQuery({
    queryKey: ["lawyers", lawyerId, "reviews", showAllReviews],
    queryFn: () => getLawyerReviews(lawyerId, 1, showAllReviews ? 20 : 3),
  });

  const profile = profileQuery.data;
  const reviews = reviewsQuery.data;
  const firstService = profile?.activeServices[0];

  function openRequestForm(serviceId?: number) {
    navigation.navigate("ServiceRequestForm", {
      lawyerId,
      serviceId,
    });
  }

  if (profileQuery.isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <View style={styles.centerScreen}>
        <Ionicons color={theme.colors.rojo} name="cloud-offline-outline" size={34} />
        <Text style={styles.stateTitle}>No pudimos cargar este perfil</Text>
        <Text style={styles.stateCopy}>Revisa tu conexion e intenta nuevamente.</Text>
        <Button label="Reintentar" onPress={() => void profileQuery.refetch()} variant="dark" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 112, 140) }]}
        showsVerticalScrollIndicator={false}
      >
        {route.params.previewBanner ? (
          <View style={styles.previewBanner}>
            <Ionicons color={theme.colors.gold} name="eye-outline" size={20} />
            <Text style={styles.previewBannerText}>Asi te ven los ciudadanos que te buscan</Text>
          </View>
        ) : null}
        <View style={styles.cover}>
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons color={theme.colors.paper} name="chevron-back" size={24} />
          </Pressable>
          <View style={styles.coverSeal}>
            <Ionicons color={theme.colors.gold} name="scale-outline" size={26} />
          </View>
        </View>

        <View style={styles.profileBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profile.fullName)}</Text>
          </View>
          <View style={styles.nameRow}>
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{profile.fullName}</Text>
              <Text style={styles.location}>
                {profile.municipality}, {profile.department}
              </Text>
            </View>
            {profile.isVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons color={theme.colors.verde} name="checkmark-circle" size={16} />
                <Text style={styles.verifiedText}>Verificado</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.stats}>
            <Stat label="Años" value={String(profile.yearsExperience)} />
            <Stat label="Calificación" value={formatRating(profile.averageRating)} />
            <Stat label="Respuesta" value="24h" />
          </View>

          <Section title="Biografia">
            <Text style={styles.bodyCopy}>{profile.bio || "Este profesional aun no ha agregado una biografia."}</Text>
            {profile.university ? <Text style={styles.school}>{profile.university}</Text> : null}
          </Section>

          <Section title="Servicios">
            <View style={styles.services}>
              {profile.activeServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() => openRequestForm(service.id)}
                />
              ))}
              {profile.activeServices.length === 0 ? (
                <Text style={styles.bodyCopy}>Este profesional no tiene servicios activos por ahora.</Text>
              ) : null}
            </View>
          </Section>

          <Section
            action={
              reviews && reviews.totalCount > 3 ? (
                <Pressable accessibilityRole="button" onPress={() => setShowAllReviews((value) => !value)}>
                  <Text style={styles.linkText}>{showAllReviews ? "Ver menos" : "Ver todas"}</Text>
                </Pressable>
              ) : null
            }
            title="Reseñas"
          >
            {reviewsQuery.isLoading ? (
              <ActivityIndicator color={theme.colors.gold} />
            ) : reviewsQuery.isError ? (
              <Text style={styles.bodyCopy}>No pudimos cargar las reseñas.</Text>
            ) : reviews?.items.length ? (
              <View style={styles.reviews}>
                {reviews.items.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </View>
            ) : (
              <Text style={styles.bodyCopy}>Aun no hay reseñas para este profesional.</Text>
            )}
          </Section>
        </View>
      </ScrollView>

      <View style={[styles.fixedBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
        <Pressable disabled style={styles.chatButton}>
          <Ionicons color={theme.colors.inkSoft} name="chatbubble-ellipses-outline" size={22} />
        </Pressable>
        <View style={styles.requestButtonWrap}>
          <Button
            disabled={!firstService}
            label="Solicitar servicio"
            onPress={() => openRequestForm(firstService?.id)}
            variant="primary"
          />
        </View>
      </View>
    </View>
  );
}

function Section({
  action,
  children,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ServiceCard({ service, onPress }: { service: PublicLawyerServiceResponse; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}>
      <View style={styles.serviceTop}>
        <View style={styles.serviceTitleBlock}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceCategory}>{service.categoryName}</Text>
        </View>
        <Ionicons color={theme.colors.navySoft} name="chevron-forward" size={20} />
      </View>
      <Text numberOfLines={2} style={styles.serviceDescription}>
        {service.description}
      </Text>
      <View style={styles.serviceMeta}>
        <Text style={styles.servicePrice}>C$ {formatMoney(service.price)}</Text>
        <Text style={styles.serviceDays}>{service.estimatedDays} dias</Text>
      </View>
    </Pressable>
  );
}

function ReviewCard({ review }: { review: LawyerReviewItemResponse }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <Text style={styles.reviewName}>{review.clientName}</Text>
        <Stars rating={review.rating} />
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-NI", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRating(value?: number | null) {
  return typeof value === "number" ? value.toFixed(1) : "Nuevo";
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
  previewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.navyDeep,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.md,
  },
  previewBannerText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.paper,
    flex: 1,
  },
  cover: {
    height: 184,
    backgroundColor: theme.colors.navy,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  coverSeal: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.navyDeep,
    borderWidth: 1,
    borderColor: theme.colors.navySoft,
  },
  profileBlock: {
    paddingHorizontal: theme.spacing.md,
    marginTop: -46,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: theme.radii.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 4,
    borderColor: theme.colors.paper,
  },
  avatarText: {
    ...theme.typography.h1,
    color: theme.colors.navy,
  },
  nameRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    ...theme.typography.h1,
    color: theme.colors.navy,
  },
  location: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
    marginTop: theme.spacing.xxs,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    backgroundColor: "rgba(63, 122, 92, 0.12)",
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  verifiedText: {
    ...theme.typography.label,
    color: theme.colors.verde,
  },
  stats: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  stat: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.line,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.navy,
  },
  statLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
    marginTop: theme.spacing.xxs,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.navy,
  },
  linkText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.gold,
  },
  bodyCopy: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  school: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
    marginTop: theme.spacing.sm,
  },
  services: {
    gap: theme.spacing.sm,
  },
  serviceCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.86,
  },
  serviceTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  serviceTitleBlock: {
    flex: 1,
  },
  serviceName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
  },
  serviceCategory: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  serviceDescription: {
    ...theme.typography.bodySm,
    color: theme.colors.ink,
  },
  serviceMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  servicePrice: {
    ...theme.typography.bodyMedium,
    color: theme.colors.verde,
  },
  serviceDays: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  reviews: {
    gap: theme.spacing.sm,
  },
  reviewCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  reviewName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
    flex: 1,
  },
  reviewComment: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  fixedBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
  },
  chatButton: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
    opacity: 0.5,
  },
  requestButtonWrap: {
    flex: 1,
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
