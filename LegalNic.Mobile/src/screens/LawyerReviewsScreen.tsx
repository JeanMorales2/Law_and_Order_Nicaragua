import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Stars } from "../components/Stars";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { getLawyerReviews } from "../services/api/lawyers";
import { useAuthStore } from "../store/authStore";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "LawyerReviews">;

export function LawyerReviewsScreen({ navigation }: Props) {
  const profileId = useAuthStore((state) => state.user?.lawyerProfile?.id);
  const reviewsQuery = useQuery({
    enabled: Boolean(profileId),
    queryKey: ["lawyers", profileId, "reviews", "mine"],
    queryFn: () => getLawyerReviews(profileId!, 1, 30),
  });

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Volver" accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons color={theme.colors.paper} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.kicker}>Reputacion</Text>
        <Text style={styles.title}>Mis reseñas</Text>
        <Text style={styles.copy}>
          {reviewsQuery.data?.averageRating ? `${reviewsQuery.data.averageRating.toFixed(1)} promedio` : "Opiniones de tus clientes"}
        </Text>
      </View>

      <View style={styles.list}>
        {reviewsQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.gold} />
        ) : reviewsQuery.data?.items.length ? (
          reviewsQuery.data.items.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.clientName}>{review.clientName}</Text>
                <Stars rating={review.rating} />
              </View>
              <Text style={styles.comment}>{review.comment}</Text>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons color={theme.colors.gold} name="star-outline" size={34} />
            <Text style={styles.emptyTitle}>Aun no tienes reseñas</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  list: {
    padding: theme.spacing.md,
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
  clientName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
    flex: 1,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  empty: {
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.navy,
  },
});
