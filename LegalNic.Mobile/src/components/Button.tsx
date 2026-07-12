import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import type { ReactNode } from "react";
import { theme } from "../theme";

type ButtonVariant = "primary" | "dark" | "outline" | "danger" | "ghost";

type ButtonProps = {
  label: string;
  accessibilityLabel?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  onPress?: () => void;
};

const variantStyles = {
  primary: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold,
    textColor: theme.colors.navyDeep,
  },
  dark: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy,
    textColor: theme.colors.paper,
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: theme.colors.navy,
    textColor: theme.colors.navy,
  },
  danger: {
    backgroundColor: theme.colors.rojo,
    borderColor: theme.colors.rojo,
    textColor: theme.colors.paper,
  },
  ghost: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: theme.colors.goldSoft,
    textColor: theme.colors.navy,
  },
} as const;

export function Button({
  accessibilityLabel,
  label,
  variant = "primary",
  disabled = false,
  loading = false,
  leftIcon,
  onPress,
}: ButtonProps) {
  const palette = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: isDisabled ? 0.45 : pressed ? 0.86 : 1,
        },
      ]}
    >
      {loading ? <ActivityIndicator color={palette.textColor} size="small" /> : leftIcon}
      <Text style={[styles.label, { color: palette.textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.button,
  },
});
