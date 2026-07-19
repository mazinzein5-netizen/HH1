---
name: Android splash & adaptive icon verification
description: How to verify Android adaptive icon masks and splash without a device; Android 12+ splash circle clipping pitfall.
---
- Android 12+ system splash clips the icon to a CIRCLE — never use a full-bleed rounded-square tile as the splash image; use a transparent-background glyph that fits the circle. Configure via the expo-splash-screen plugin (top-level "splash" key is legacy in SDK 52+), with an `android` sub-object for a circle-safe image.
- **Why:** the branded rounded tile (splash-icon.png) would have its corners visibly cut on Android 12+; iOS keeps the tile, Android gets the cross glyph.
- Verification without a device: PIL mask simulation (circle/squircle/rounded, mask r = 72/108 of canvas; safe zone r = 66/108), plus `npx expo prebuild --platform android --no-install` in the artifact dir to inspect generated res/ (then `rm -rf android` and restore package.json — prebuild mutates it).
- Adaptive icon foreground: PNG may report as "1-bit grayscale" via `file` yet still carry a transparency layer — check corner alpha with PIL before assuming it's opaque.
- EAS cloud builds are impossible here without EXPO_TOKEN (unset); real-device install always needs the user.
