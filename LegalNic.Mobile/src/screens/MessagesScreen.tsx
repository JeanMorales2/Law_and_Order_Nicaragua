import { Ionicons } from "@expo/vector-icons";
import { useQueries, useQuery } from "@tanstack/react-query";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { ChatMessageResponse, ServiceRequestSummaryResponse } from "../services/api/contracts";
import {
  getMyServiceRequests,
  getReceivedServiceRequests,
  getRequestMessages,
} from "../services/api/requests";
import { useAuthStore } from "../store/authStore";
import { theme } from "../theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Conversation = {
  request: ServiceRequestSummaryResponse;
  lastMessage?: ChatMessageResponse;
};

export function MessagesScreen() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const role = useAuthStore((state) => state.role);
  const isCitizen = role === "Citizen";

  const requestsQuery = useQuery({
    queryKey: ["messages", "requests", role],
    queryFn: () => (isCitizen ? getMyServiceRequests() : getReceivedServiceRequests()),
    enabled: Boolean(role),
  });

  const messageQueries = useQueries({
    queries: (requestsQuery.data ?? []).map((request) => ({
      queryKey: ["requests", request.id, "messages"],
      queryFn: () => getRequestMessages(request.id),
      enabled: requestsQuery.isSuccess,
    })),
  });

  const conversations = (requestsQuery.data ?? [])
    .map((request, index): Conversation => {
      const messages = messageQueries[index]?.data ?? [];
      return {
        request,
        lastMessage: messages[messages.length - 1],
      };
    })
    .sort((left, right) => {
      const leftTime = new Date(left.lastMessage?.sentAt ?? left.request.createdAt).getTime();
      const rightTime = new Date(right.lastMessage?.sentAt ?? right.request.createdAt).getTime();

      return rightTime - leftTime;
    });

  const loadingMessages = messageQueries.some((query) => query.isLoading);
  const refreshing = requestsQuery.isRefetching || messageQueries.some((query) => query.isRefetching);

  function refresh() {
    void requestsQuery.refetch();
    messageQueries.forEach((query) => void query.refetch());
  }

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 92, 120) }]}
        data={conversations}
        keyExtractor={(item) => String(item.request.id)}
        ListEmptyComponent={
          requestsQuery.isLoading || loadingMessages ? (
            <SkeletonList />
          ) : requestsQuery.isError ? (
            <ErrorState onRetry={() => void requestsQuery.refetch()} />
          ) : (
            <EmptyState />
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.kicker}>Mensajeria</Text>
            <Text style={styles.title}>Mensajes</Text>
            <Text style={styles.copy}>Conversaciones vinculadas a tus solicitudes activas y pasadas.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[theme.colors.gold]}
            onRefresh={refresh}
            refreshing={refreshing}
            tintColor={theme.colors.gold}
          />
        }
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            currentUserId={useAuthStore.getState().user?.id}
            onPress={() =>
              navigation.navigate("RequestChat", {
                requestId: item.request.id,
              })
            }
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function ConversationCard({
  conversation,
  currentUserId,
  onPress,
}: {
  conversation: Conversation;
  currentUserId?: number;
  onPress: () => void;
}) {
  const { lastMessage, request } = conversation;
  const ownLastMessage = lastMessage?.senderId === currentUserId;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(request.counterpartyName)}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardTitleBlock}>
            <Text numberOfLines={1} style={styles.name}>
              {request.counterpartyName}
            </Text>
            <Text numberOfLines={1} style={styles.serviceName}>
              {request.serviceName}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatConversationTime(lastMessage?.sentAt ?? request.createdAt)}</Text>
        </View>
        <Text numberOfLines={2} style={styles.preview}>
          {lastMessage ? `${ownLastMessage ? "Tu: " : ""}${lastMessage.content}` : "Sin mensajes todavia"}
        </Text>
      </View>
    </Pressable>
  );
}

function SkeletonList() {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 4 }, (_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonLines}>
            <View style={styles.skeletonWide} />
            <View style={styles.skeletonLine} />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.stateBox}>
      <Ionicons color={theme.colors.gold} name="chatbubble-ellipses-outline" size={34} />
      <Text style={styles.stateTitle}>Aun no hay conversaciones</Text>
      <Text style={styles.stateCopy}>Cuando exista una solicitud, podras escribir desde aqui.</Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.stateBox}>
      <Ionicons color={theme.colors.rojo} name="cloud-offline-outline" size={34} />
      <Text style={styles.stateTitle}>No pudimos cargar tus mensajes</Text>
      <Text style={styles.stateCopy}>Revisa tu conexion e intenta nuevamente.</Text>
      <Button label="Reintentar" onPress={onRetry} variant="dark" />
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

function formatConversationTime(value: string) {
  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
  },
  header: {
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xl,
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
  },
  card: {
    flexDirection: "row",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.86,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  avatarText: {
    ...theme.typography.h3,
    color: theme.colors.navy,
  },
  cardBody: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  cardTitleBlock: {
    flex: 1,
  },
  name: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
  },
  serviceName: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  timeText: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  preview: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  skeletonWrap: {
    gap: theme.spacing.sm,
  },
  skeletonCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
  },
  skeletonAvatar: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.goldSoft,
  },
  skeletonLines: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  skeletonWide: {
    width: "78%",
    height: 14,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.goldSoft,
  },
  skeletonLine: {
    width: "54%",
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
