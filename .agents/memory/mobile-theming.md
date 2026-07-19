---
name: Mobile theming (light/dark)
description: How the Expo mobile app resolves colors and what does NOT adapt to theme.
---

The mobile app supports Light / Dark / System themes.

- `constants/colors.ts` exports two full palettes: `dark` (the original app palette) and `light`, plus a shared `radius`.
- `context/ThemeContext.tsx` owns the active mode (persisted in AsyncStorage under `@hive_theme_mode`), resolves `isDark` (system mode falls back to dark when the OS scheme is null), and exposes the resolved `colors`.
- `hooks/useColors()` just returns `useTheme().colors`. **Any component calling `useColors` must be rendered inside `ThemeProvider`** (mounted in root `app/_layout.tsx`). The context ships a dark default so it won't crash outside the provider, but that silently masks misconfiguration.
- `components/ThemedStatusBar.tsx` is the app-wide StatusBar — it derives `barStyle` from `isDark`. Use it instead of raw `<StatusBar>`.

**Why this matters / gotcha:** Many screens still use hardcoded gradient hex values (e.g. dark blue/gold `LinearGradient colors={[...]}`) for hero cards and buttons. These are intentional branded panels and do **NOT** switch with the theme — they stay dark in light mode by design. If a future task needs fully theme-reactive gradients, those hardcoded arrays must be moved into the palettes.

**Logo editor:** The old Settings "Logo & Visual Theme" editor (gold-intensity slider, depth/density/text-weight pickers) was removed. `LogoThemeContext` still exists and supplies default `density` to `HoneycombWallpaper` across screens — keep it even though its values are no longer user-editable.
