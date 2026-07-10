import { Pressable, StyleSheet, Text } from "react-native";
import type { ReactNode } from "react";
import { theme } from "../theme";

type ButtonVariant = "primary" | "dark" | "outline" | "danger" | "ghost";

type ButtonProps = {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
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
  label,
  variant = "primary",
  disabled = false,
  leftIcon,
  onPress,
}: ButtonProps) {
  const palette = variantStyles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: disabled ? 0.45 : pressed ? 0.86 : 1,
        },
      ]}
    >
      {leftIcon}
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
