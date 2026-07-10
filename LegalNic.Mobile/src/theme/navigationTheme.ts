import { DefaultTheme, type Theme } from "@react-navigation/native";
import { colors } from "./colors";

export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.navy,
    background: colors.paper,
    card: colors.paper,
    text: colors.ink,
    border: colors.line,
    notification: colors.gold,
  },
};
