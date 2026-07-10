import { colors } from "./colors";
import { fontFamilies, typography } from "./typography";
import { spacing } from "./spacing";
import { radii } from "./radii";
import { shadows } from "./shadows";

export const theme = {
  colors,
  fontFamilies,
  typography,
  spacing,
  radii,
  shadows,
} as const;

export type AppTheme = typeof theme;
