import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { getCurrentUser, updateCurrentUser } from "../services/api/users";
import { useAuthStore } from "../store/authStore";
import { theme } from "../theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function AccountScreen() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const storeUser = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(storeUser?.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(storeUser?.phoneNumber ?? "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: getCurrentUser,
  });

  const user = meQuery.data ?? storeUser;
  const isProfessional = user?.role === "Lawyer" || user?.role === "Student";

  useEffect(() => {
    if (!editing && user) {
      setFullName(user.fullName);
      setPhoneNumber(user.phoneNumber);
    }
  }, [editing, user]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateCurrentUser({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users", "me"] }),
        refreshProfile(),
      ]);
      setSaveMessage("Datos actualizados correctamente.");
      setEditing(false);
    },
    onError: () => {
      setSaveMessage("No pudimos guardar los cambios. Intenta nuevamente.");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
      queryClient.clear();
    },
  });

  function saveProfile() {
    setSaveMessage(null);

    if (!fullName.trim() || !phoneNumber.trim()) {
      setSaveMessage("Nombre y telefono son obligatorios.");
      return;
    }

    updateMutation.mutate();
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 32, 56) }]}
      style={styles.screen}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.fullName ?? "")}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Cuenta</Text>
          <Text style={styles.name}>{user?.fullName ?? "Cargando..."}</Text>
          <Text style={styles.email}>{user?.email ?? ""}</Text>
        </View>
      </View>

      {meQuery.isLoading && !user ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.colors.gold} />
        </View>
      ) : null}

      {meQuery.isError ? (
        <View style={styles.inlineError}>
          <Ionicons color={theme.colors.rojo} name="cloud-offline-outline" size={20} />
          <Text style={styles.inlineErrorText}>No pudimos actualizar tus datos de cuenta.</Text>
          <Pressable onPress={() => void meQuery.refetch()}>
            <Text style={styles.inlineLink}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      <Section
        action={
          <Pressable accessibilityRole="button" onPress={() => setEditing((value) => !value)}>
            <Text style={styles.linkText}>{editing ? "Cancelar" : "Editar"}</Text>
          </Pressable>
        }
        title="Datos personales"
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            editable={editing}
            onChangeText={setFullName}
            placeholder="Nombre completo"
            placeholderTextColor={theme.colors.inkSoft}
            style={[styles.input, !editing && styles.inputDisabled]}
            value={fullName}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Telefono</Text>
          <TextInput
            editable={editing}
            keyboardType="phone-pad"
            onChangeText={setPhoneNumber}
            placeholder="Telefono"
            placeholderTextColor={theme.colors.inkSoft}
            style={[styles.input, !editing && styles.inputDisabled]}
            value={phoneNumber}
          />
        </View>
        {saveMessage ? (
          <Text style={[styles.saveMessage, updateMutation.isError && styles.saveMessageError]}>{saveMessage}</Text>
        ) : null}
        {editing ? (
          <Button
            label="Guardar cambios"
            loading={updateMutation.isPending}
            onPress={saveProfile}
            variant="dark"
          />
        ) : null}
      </Section>

      <Section title="Notificaciones">
        <View style={styles.optionRow}>
          <View style={styles.optionTextBlock}>
            <Text style={styles.optionTitle}>Preferencias de notificacion</Text>
            <Text style={styles.optionCopy}>Recibir avisos sobre solicitudes, mensajes y reseñas.</Text>
          </View>
          <Switch
            onValueChange={setNotificationsEnabled}
            thumbColor={theme.colors.white}
            trackColor={{ false: theme.colors.line, true: theme.colors.gold }}
            value={notificationsEnabled}
          />
        </View>
      </Section>

      {!isProfessional ? (
        <Section title="Historial">
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("AccountHistory")}
            style={({ pressed }) => [styles.navOption, pressed && styles.pressed]}
          >
            <View style={styles.navIcon}>
              <Ionicons color={theme.colors.navy} name="folder-open-outline" size={22} />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={styles.optionTitle}>Historial de tramites</Text>
              <Text style={styles.optionCopy}>Solicitudes finalizadas y rechazadas.</Text>
            </View>
            <Ionicons color={theme.colors.navySoft} name="chevron-forward" size={20} />
          </Pressable>
        </Section>
      ) : null}

      {isProfessional ? (
        <Section title="Perfil profesional">
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("LawyerVerificationDocuments")}
            style={({ pressed }) => [styles.navOption, pressed && styles.pressed]}
          >
            <View style={styles.navIcon}>
              <Ionicons color={theme.colors.navy} name="shield-checkmark-outline" size={22} />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={styles.optionTitle}>Documentos de verificacion</Text>
              <Text style={styles.optionCopy}>Estado: {user?.lawyerProfile?.verificationStatus ?? "Pendiente"}</Text>
            </View>
            <Ionicons color={theme.colors.navySoft} name="chevron-forward" size={20} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => user?.lawyerProfile?.id && navigation.navigate("LawyerProfile", { lawyerId: user.lawyerProfile.id, previewBanner: true })}
            style={({ pressed }) => [styles.navOption, pressed && styles.pressed]}
          >
            <View style={styles.navIcon}>
              <Ionicons color={theme.colors.navy} name="person-circle-outline" size={22} />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={styles.optionTitle}>Vista publica</Text>
              <Text style={styles.optionCopy}>{user?.lawyerProfile?.municipality}, {user?.lawyerProfile?.department}</Text>
            </View>
            <Ionicons color={theme.colors.navySoft} name="chevron-forward" size={20} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("LawyerCommissions")}
            style={({ pressed }) => [styles.navOption, pressed && styles.pressed]}
          >
            <View style={styles.navIcon}>
              <Ionicons color={theme.colors.navy} name="cash-outline" size={22} />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={styles.optionTitle}>Ingresos y comisiones</Text>
              <Text style={styles.optionCopy}>Estado de cuenta LegalNic.</Text>
            </View>
            <Ionicons color={theme.colors.navySoft} name="chevron-forward" size={20} />
          </Pressable>
        </Section>
      ) : null}

      <Button
        label="Cerrar sesion"
        loading={logoutMutation.isPending}
        onPress={() => logoutMutation.mutate()}
        variant="outline"
      />
    </ScrollView>
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.navy,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: theme.radii.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
  },
  avatarText: {
    ...theme.typography.h2,
    color: theme.colors.navy,
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    ...theme.typography.label,
    color: theme.colors.gold,
    textTransform: "uppercase",
  },
  name: {
    ...theme.typography.h2,
    color: theme.colors.paper,
    marginTop: theme.spacing.xxs,
  },
  email: {
    ...theme.typography.body,
    color: theme.colors.goldSoft,
    marginTop: theme.spacing.xxs,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: "rgba(162, 59, 59, 0.1)",
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  inlineErrorText: {
    ...theme.typography.bodySm,
    color: theme.colors.rojo,
    flex: 1,
  },
  inlineLink: {
    ...theme.typography.bodyMedium,
    color: theme.colors.rojo,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.navy,
  },
  linkText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.gold,
  },
  fieldGroup: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.inkSoft,
    textTransform: "uppercase",
  },
  input: {
    ...theme.typography.body,
    minHeight: 48,
    color: theme.colors.ink,
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingHorizontal: theme.spacing.md,
  },
  inputDisabled: {
    color: theme.colors.inkSoft,
  },
  saveMessage: {
    ...theme.typography.bodySm,
    color: theme.colors.verde,
  },
  saveMessageError: {
    color: theme.colors.rojo,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
  },
  optionCopy: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
    marginTop: theme.spacing.xxs,
  },
  navOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  navIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
  },
  pressed: {
    opacity: 0.86,
  },
});
