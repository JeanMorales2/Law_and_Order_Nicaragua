import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../components/Button";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { AvailabilityDay, DayOfWeek } from "../services/api/contracts";
import { getMyAvailability, replaceMyAvailability } from "../services/api/availability";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "LawyerAvailability">;

const days: Array<{ key: DayOfWeek; label: string }> = [
  { key: "Monday", label: "Lunes" },
  { key: "Tuesday", label: "Martes" },
  { key: "Wednesday", label: "Miercoles" },
  { key: "Thursday", label: "Jueves" },
  { key: "Friday", label: "Viernes" },
  { key: "Saturday", label: "Sabado" },
  { key: "Sunday", label: "Domingo" },
];

export function LawyerAvailabilityScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState<AvailabilityDay[]>(buildDefaultSchedule());
  const [message, setMessage] = useState<string | null>(null);

  const availabilityQuery = useQuery({
    queryKey: ["lawyers", "me", "availability"],
    queryFn: getMyAvailability,
  });

  useEffect(() => {
    if (availabilityQuery.data?.length) {
      setSchedule(mergeSchedule(availabilityQuery.data));
    }
  }, [availabilityQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => replaceMyAvailability(schedule),
    onSuccess: async () => {
      setMessage("Disponibilidad guardada.");
      await queryClient.invalidateQueries({ queryKey: ["lawyers", "me", "availability"] });
    },
    onError: () => setMessage("No pudimos guardar. Revisa que el horario final sea mayor al inicial."),
  });

  function updateDay(dayOfWeek: DayOfWeek, patch: Partial<AvailabilityDay>) {
    setSchedule((current) => current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)));
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Volver" accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons color={theme.colors.paper} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.kicker}>Agenda</Text>
        <Text style={styles.title}>Disponibilidad</Text>
        <Text style={styles.copy}>Configura los dias y horarios en que puedes atender solicitudes.</Text>
      </View>

      <View style={styles.body}>
        {availabilityQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.gold} />
        ) : (
          schedule.map((day) => (
            <View key={day.dayOfWeek} style={styles.dayCard}>
              <View style={styles.dayTop}>
                <Text style={styles.dayLabel}>{days.find((item) => item.key === day.dayOfWeek)?.label}</Text>
                <Switch
                  onValueChange={(isActive) => updateDay(day.dayOfWeek, { isActive })}
                  thumbColor={theme.colors.white}
                  trackColor={{ false: theme.colors.line, true: theme.colors.gold }}
                  value={day.isActive}
                />
              </View>
              <View style={styles.timeRow}>
                <TimeField label="Inicio" value={trimSeconds(day.startTime)} onChangeText={(value) => updateDay(day.dayOfWeek, { startTime: normalizeTime(value) })} />
                <TimeField label="Fin" value={trimSeconds(day.endTime)} onChangeText={(value) => updateDay(day.dayOfWeek, { endTime: normalizeTime(value) })} />
              </View>
            </View>
          ))
        )}
        {message ? <Text style={[styles.message, saveMutation.isError && styles.messageError]}>{message}</Text> : null}
        <Button label="Guardar disponibilidad" loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} variant="primary" />
      </View>
    </ScrollView>
  );
}

function TimeField({ label, onChangeText, value }: { label: string; onChangeText: (value: string) => void; value: string }) {
  return (
    <View style={styles.timeField}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput keyboardType="numbers-and-punctuation" onChangeText={onChangeText} placeholder="09:00" style={styles.timeInput} value={value} />
    </View>
  );
}

function buildDefaultSchedule(): AvailabilityDay[] {
  return days.map((day) => ({
    dayOfWeek: day.key,
    isActive: day.key !== "Saturday" && day.key !== "Sunday",
    startTime: "09:00:00",
    endTime: "17:00:00",
  }));
}

function mergeSchedule(items: AvailabilityDay[]) {
  return days.map((day) => items.find((item) => item.dayOfWeek === day.key) ?? buildDefaultSchedule().find((item) => item.dayOfWeek === day.key)!);
}

function trimSeconds(value: string) {
  return value.slice(0, 5);
}

function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  content: { paddingBottom: theme.spacing.xxxl },
  header: { backgroundColor: theme.colors.navy, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxxl, paddingBottom: theme.spacing.xl },
  backButton: { width: 44, height: 44, borderRadius: theme.radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255, 255, 255, 0.12)", marginBottom: theme.spacing.lg },
  kicker: { ...theme.typography.label, color: theme.colors.gold, textTransform: "uppercase" },
  title: { ...theme.typography.h1, color: theme.colors.paper, marginTop: theme.spacing.xs },
  copy: { ...theme.typography.body, color: theme.colors.goldSoft, marginTop: theme.spacing.xs },
  body: { padding: theme.spacing.md, gap: theme.spacing.sm },
  dayCard: { backgroundColor: theme.colors.white, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.md, gap: theme.spacing.sm },
  dayTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayLabel: { ...theme.typography.bodyMedium, color: theme.colors.navy },
  timeRow: { flexDirection: "row", gap: theme.spacing.sm },
  timeField: { flex: 1, gap: theme.spacing.xs },
  timeLabel: { ...theme.typography.label, color: theme.colors.inkSoft, textTransform: "uppercase" },
  timeInput: { ...theme.typography.body, minHeight: 46, color: theme.colors.ink, backgroundColor: theme.colors.paper, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: theme.spacing.md },
  message: { ...theme.typography.bodySm, color: theme.colors.verde },
  messageError: { color: theme.colors.rojo },
});
