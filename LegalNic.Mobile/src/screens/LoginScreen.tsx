import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { theme } from "../theme";
import { useAuthStore } from "../store/authStore";
import { toApiError } from "../services/api/errors";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation, route }: Props) {
  const signInWithPassword = useAuthStore((state) => state.signInWithPassword);
  const [email, setEmail] = useState(route.params?.prefilledEmail ?? "");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.prefilledEmail) {
      setEmail(route.params.prefilledEmail);
    }
  }, [route.params?.prefilledEmail]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      await signInWithPassword({
        email: email.trim(),
        password,
      });
    },
    onError: (error) => {
      setErrorMessage(toApiError(error).message);
    },
  });

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.brand}>LegalNic</Text>
            <Text style={styles.title}>Ingresa a tu cuenta</Text>
            <Text style={styles.copy}>
              Conecta el movil con la API real del backend usando JWT seguro y refresco automatico.
            </Text>
          </View>

          <Card>
            <Input
              autoCapitalize="none"
              keyboardType="email-address"
              label="Correo"
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              value={email}
            />
            <Input
              label="Contrasena"
              onChangeText={setPassword}
              placeholder="Tu contrasena"
              secureTextEntry
              value={password}
            />
            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
            {route.params?.successMessage ? <Text style={styles.success}>{route.params.successMessage}</Text> : null}
            <Button
              label="Entrar"
              loading={loginMutation.isPending}
              onPress={() => {
                setErrorMessage(null);
                loginMutation.mutate();
              }}
              variant="dark"
            />
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Aun no tienes cuenta?</Text>
            <Pressable onPress={() => navigation.navigate("Register")} style={styles.linkButton}>
              <Text style={styles.linkText}>Registrate</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: "center",
    gap: theme.spacing.xl,
  },
  hero: {
    gap: theme.spacing.sm,
  },
  brand: {
    ...theme.typography.h2,
    color: theme.colors.gold,
  },
  title: {
    ...theme.typography.display,
    color: theme.colors.navyDeep,
  },
  copy: {
    ...theme.typography.bodyLg,
    color: theme.colors.inkSoft,
  },
  error: {
    ...theme.typography.bodySm,
    color: theme.colors.rojo,
  },
  success: {
    ...theme.typography.bodySm,
    color: theme.colors.verde,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
  linkButton: {
    paddingVertical: 4,
  },
  linkText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
  },
});
