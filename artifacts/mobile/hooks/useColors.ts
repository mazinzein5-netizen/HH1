import { useTheme } from "@/context/ThemeContext";

/**
 * Returns the design tokens for the active color scheme.
 *
 * The palette is resolved by {@link ThemeProvider}, which honours the user's
 * saved preference (Light / Dark / System). The returned object contains all
 * color tokens for the active palette plus scheme-independent values like
 * `radius`.
 */
export function useColors() {
  return useTheme().colors;
}
