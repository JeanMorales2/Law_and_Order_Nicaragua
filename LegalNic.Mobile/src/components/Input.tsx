import { forwardRef } from "react";
import type { TextInputProps } from "react-native";
import { StyleSheet, TextInput } from "react-native";
import { Field } from "./Field";
import { theme } from "../theme";

type InputProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, hint, error, placeholderTextColor = theme.colors.inkSoft, style, ...props },
  ref,
) {
  return (
    <Field error={error} hint={hint} label={label}>
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
    </Field>
  );
});

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.ink,
    ...theme.typography.body,
  },
  inputError: {
    borderColor: theme.colors.rojo,
  },
});
