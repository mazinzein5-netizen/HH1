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

**Contrast rule:** Text on a hardcoded dark gradient/panel must use hardcoded light colors, NEVER theme tokens (they turn dark in light mode and vanish). The inverse also bites: hardcoded white/rgba-white text or chrome on a theme-token background (e.g. `colors.goldBg`, `colors.card`) vanishes in light mode — those must use theme tokens. When auditing light mode, grep for hardcoded `LinearGradient colors={["#0...` and `rgba(255,255,255` and match each text color strategy to whether its background is fixed or theme-driven. The "Not a medical device" disclaimer is theme-conditional orange: `#E8590C` dark / `#C2410C` light (WCAG — one hex can't pass on both).

**Logo editor:** The old Settings "Logo & Visual Theme" editor (gold-intensity slider, depth/density/text-weight pickers) was removed. `LogoThemeContext` still exists and supplies default `density` to `HoneycombWallpaper` across screens — keep it even though its values are no longer user-editable.
