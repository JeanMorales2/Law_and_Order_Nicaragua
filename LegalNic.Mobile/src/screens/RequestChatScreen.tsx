import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { HubConnection } from "@microsoft/signalr";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  createChatConnection,
  joinRequestGroup,
  onReceiveMessage,
  sendRequestMessage,
  startChatConnection,
  type ChatConnectionStatus,
} from "../services/api/chatHub";
import type { ChatMessageResponse } from "../services/api/contracts";
import {
  getRequestMessages,
  getServiceRequestDetail,
  markRequestMessagesAsRead,
} from "../services/api/requests";
import { useAuthStore } from "../store/authStore";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "RequestChat">;

export function RequestChatScreen({ navigation, route }: Props) {
  const requestId = route.params.requestId;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<ChatMessageResponse>>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ChatConnectionStatus>("connecting");
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["requests", "detail", requestId],
    queryFn: () => getServiceRequestDetail(requestId),
  });

  const messagesQuery = useQuery({
    queryKey: ["requests", requestId, "messages"],
    queryFn: () => getRequestMessages(requestId),
  });

  const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);
  const canSend = draft.trim().length > 0 && connectionStatus === "connected" && !sending;

  useEffect(() => {
    void markRequestMessagesAsRead(requestId)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["requests", requestId, "messages"] });
        void queryClient.invalidateQueries({ queryKey: ["messages"] });
      })
      .catch(() => undefined);
  }, [queryClient, requestId]);

  useEffect(() => {
    const connection = createChatConnection();
    connectionRef.current = connection;

    const mergeMessage = (message: ChatMessageResponse) => {
      if (message.serviceRequestId !== requestId) {
        return;
      }

      queryClient.setQueryData<ChatMessageResponse[]>(["requests", requestId, "messages"], (current) => {
        const existing = current ?? [];

        if (existing.some((item) => item.id === message.id)) {
          return existing;
        }

        return [...existing, message].sort(
          (left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
        );
      });

      void queryClient.invalidateQueries({ queryKey: ["messages", "requests"] });
    };

    const removeHandler = onReceiveMessage(connection, mergeMessage);

    connection.onreconnecting(() => {
      setConnectionStatus("reconnecting");
    });

    connection.onreconnected(() => {
      setConnectionStatus("connected");
      void joinRequestGroup(connection, requestId);
    });

    connection.onclose(() => {
      setConnectionStatus("disconnected");
    });

    async function connect() {
      try {
        setConnectionStatus("connecting");
        await startChatConnection(connection);
        await joinRequestGroup(connection, requestId);
        setConnectionStatus("connected");
      } catch {
        setConnectionStatus("disconnected");
      }
    }

    void connect();

    return () => {
      removeHandler();
      connectionRef.current = null;
      void connection.stop();
    };
  }, [queryClient, requestId]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  async function sendMessage() {
    const content = draft.trim();
    const connection = connectionRef.current;

    if (!content || !connection) {
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      await sendRequestMessage(connection, requestId, content);
      setDraft("");
    } catch {
      setSendError("No pudimos enviar el mensaje. Intenta nuevamente.");
    } finally {
      setSending(false);
    }
  }

  if (detailQuery.isLoading || messagesQuery.isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  if (detailQuery.isError || messagesQuery.isError || !detailQuery.data) {
    return (
      <View style={styles.centerScreen}>
        <Ionicons color={theme.colors.rojo} name="cloud-offline-outline" size={34} />
        <Text style={styles.stateTitle}>No pudimos cargar el chat</Text>
        <Text style={styles.stateCopy}>Revisa tu conexion e intenta nuevamente.</Text>
        <Button
          label="Reintentar"
          onPress={() => {
            void detailQuery.refetch();
            void messagesQuery.refetch();
          }}
          variant="dark"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Volver" accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons color={theme.colors.paper} name="chevron-back" size={24} />
        </Pressable>
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.title}>
            {detailQuery.data.lawyerName === useAuthStore.getState().user?.fullName
              ? detailQuery.data.clientName
              : detailQuery.data.lawyerName}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {detailQuery.data.serviceName}
          </Text>
          <Text style={styles.connectionText}>{getConnectionLabel(connectionStatus)}</Text>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.messagesContent}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<EmptyMessages />}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ref={listRef}
        renderItem={({ item }) => (
          <MessageBubble message={item} own={item.senderId === currentUserId} />
        )}
        showsVerticalScrollIndicator={false}
      />

      {sendError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{sendError}</Text>
        </View>
      ) : null}

      <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
        <TextInput
          multiline
          onChangeText={setDraft}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={theme.colors.inkSoft}
          style={styles.input}
          value={draft}
        />
        <Pressable
          accessibilityLabel="Enviar mensaje"
          accessibilityRole="button"
          disabled={!canSend}
          onPress={() => void sendMessage()}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        >
          {sending ? (
            <ActivityIndicator color={theme.colors.paper} size="small" />
          ) : (
            <Ionicons color={theme.colors.paper} name="send" size={20} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, own }: { message: ChatMessageResponse; own: boolean }) {
  return (
    <View style={[styles.bubbleRow, own ? styles.bubbleRowOwn : styles.bubbleRowOther]}>
      <View style={[styles.bubble, own ? styles.bubbleOwn : styles.bubbleOther]}>
        {!own ? <Text style={styles.senderName}>{message.senderName}</Text> : null}
        <Text style={[styles.messageText, own ? styles.messageTextOwn : styles.messageTextOther]}>
          {message.content}
        </Text>
        <Text style={[styles.messageTime, own ? styles.messageTimeOwn : styles.messageTimeOther]}>
          {formatMessageTime(message.sentAt)}
        </Text>
      </View>
    </View>
  );
}

function EmptyMessages() {
  return (
    <View style={styles.emptyMessages}>
      <Ionicons color={theme.colors.gold} name="chatbubbles-outline" size={34} />
      <Text style={styles.stateTitle}>Inicia la conversacion</Text>
      <Text style={styles.stateCopy}>Los mensajes nuevos apareceran aqui en tiempo real.</Text>
    </View>
  );
}

function getConnectionLabel(status: ChatConnectionStatus) {
  switch (status) {
    case "connected":
      return "Conectado";
    case "connecting":
      return "Conectando...";
    case "reconnecting":
      return "Reconectando...";
    case "disconnected":
      return "Sin conexion";
  }
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("es-NI", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.navy,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.paper,
  },
  subtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.goldSoft,
  },
  connectionText: {
    ...theme.typography.label,
    color: theme.colors.gold,
    marginTop: theme.spacing.xxs,
    textTransform: "uppercase",
  },
  messagesContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  bubbleRow: {
    flexDirection: "row",
  },
  bubbleRowOwn: {
    justifyContent: "flex-end",
  },
  bubbleRowOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xxs,
  },
  bubbleOwn: {
    backgroundColor: theme.colors.navy,
    borderTopRightRadius: theme.radii.sm,
  },
  bubbleOther: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderTopLeftRadius: theme.radii.sm,
  },
  senderName: {
    ...theme.typography.label,
    color: theme.colors.gold,
  },
  messageText: {
    ...theme.typography.body,
  },
  messageTextOwn: {
    color: theme.colors.paper,
  },
  messageTextOther: {
    color: theme.colors.ink,
  },
  messageTime: {
    ...theme.typography.bodySm,
    alignSelf: "flex-end",
  },
  messageTimeOwn: {
    color: theme.colors.goldSoft,
  },
  messageTimeOther: {
    color: theme.colors.inkSoft,
  },
  emptyMessages: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xxxl,
  },
  errorBanner: {
    backgroundColor: "rgba(162, 59, 59, 0.1)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.bodySm,
    color: theme.colors.rojo,
    textAlign: "center",
  },
  composerWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
  },
  input: {
    ...theme.typography.body,
    flex: 1,
    maxHeight: 120,
    minHeight: 48,
    color: theme.colors.ink,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.navy,
  },
  sendButtonDisabled: {
    opacity: 0.45,
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
