import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Input } from "../components/Input";
import { ScreenHeader } from "../components/ScreenHeader";
import { theme } from "../theme";
import { useAuthStore } from "../store/authStore";
import { toApiError } from "../services/api/errors";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { RegisterRequest, UserRole } from "../services/api/contracts";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

type AccountOption = Exclude<UserRole, "Admin">;

const accountOptions: AccountOption[] = ["Citizen", "Lawyer", "Student"];

export function RegisterScreen({ navigation }: Props) {
  const registerAccount = useAuthStore((state) => state.registerAccount);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountOption>("Citizen");
  const [barNumber, setBarNumber] = useState("");
  const [university, setUniversity] = useState("");
  const [yearsExperience, setYearsExperience] = useState("0");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const needsLawyerProfile = role === "Lawyer" || role === "Student";
  const barNumberLabel = role === "Student" ? "Carne estudiantil" : "Carne profesional";

  const payload = useMemo<RegisterRequest>(() => {
    if (!needsLawyerProfile) {
      return {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        role,
        lawyerProfile: null,
      };
    }

    return {
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      password,
      role,
      lawyerProfile: {
        barNumber: barNumber.trim(),
        university: university.trim(),
        yearsExperience: Number.parseInt(yearsExperience || "0", 10) || 0,
        bio: bio.trim(),
        department: department.trim(),
        municipality: municipality.trim(),
      },
    };
  }, [
    barNumber,
    bio,
    department,
    email,
    fullName,
    municipality,
    needsLawyerProfile,
    password,
    phoneNumber,
    role,
    university,
    yearsExperience,
  ]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      await registerAccount(payload);
    },
    onSuccess: () => {
      navigation.replace("Login", {
        prefilledEmail: email.trim(),
        successMessage: "Cuenta creada. Ahora inicia sesion.",
      });
    },
    onError: (error) => {
      setErrorMessage(toApiError(error).message);
    },
  });

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            onBackPress={() => navigation.goBack()}
            showBackButton
            subtitle="Usamos exactamente el contrato de registro del backend."
            title="Crear cuenta"
          />

          <Card>
            <Input label="Nombre completo" onChangeText={setFullName} placeholder="Tu nombre" value={fullName} />
            <Input
              autoCapitalize="none"
              keyboardType="email-address"
              label="Correo"
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              value={email}
            />
            <Input
              keyboardType="phone-pad"
              label="Telefono"
              onChangeText={setPhoneNumber}
              placeholder="8888-0000"
              value={phoneNumber}
            />
            <Input
              label="Contrasena"
              onChangeText={setPassword}
              placeholder="Minimo 8 caracteres, con mayuscula y numero"
              secureTextEntry
              value={password}
            />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Tipo de cuenta</Text>
            <View style={styles.rowWrap}>
              {accountOptions.map((option) => (
                <Chip
                  key={option}
                  label={labelForRole(option)}
                  onPress={() => setRole(option)}
                  selected={role === option}
                />
              ))}
            </View>
          </Card>

          {needsLawyerProfile ? (
            <Card>
              <Text style={styles.sectionTitle}>Datos profesionales</Text>
              <Input
                hint="Este campo es obligatorio segun el contrato del backend."
                label={barNumberLabel}
                onChangeText={setBarNumber}
                placeholder={role === "Student" ? "Numero de carne" : "Numero de colegiacion"}
                value={barNumber}
              />
              <Input
                label="Universidad"
                onChangeText={setUniversity}
                placeholder="Universidad"
                value={university}
              />
              <Input
                keyboardType="number-pad"
                label="Anios de experiencia"
                onChangeText={setYearsExperience}
                placeholder="0"
                value={yearsExperience}
              />
              <Input
                label="Departamento"
                onChangeText={setDepartment}
                placeholder="Managua"
                value={department}
              />
              <Input
                label="Municipio"
                onChangeText={setMunicipality}
                placeholder="Managua"
                value={municipality}
              />
              <Input
                label="Bio"
                multiline
                numberOfLines={4}
                onChangeText={setBio}
                placeholder="Resumen breve de tu perfil"
                style={styles.multiline}
                textAlignVertical="top"
                value={bio}
              />
            </Card>
          ) : null}

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <Button
            label="Crear cuenta"
            loading={registerMutation.isPending}
            onPress={() => {
              setErrorMessage(null);
              registerMutation.mutate();
            }}
            variant="dark"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function labelForRole(role: AccountOption) {
  switch (role) {
    case "Citizen":
      return "Ciudadano";
    case "Lawyer":
      return "Abogado";
    case "Student":
      return "Estudiante";
  }
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
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.navyDeep,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  multiline: {
    minHeight: 120,
    paddingTop: theme.spacing.md,
  },
  error: {
    ...theme.typography.bodySm,
    color: theme.colors.rojo,
  },
});
