# Building the Android App (APK) with EAS

This guide walks you through building an installable Android APK of HIVE Companion. The APK is a real app build, so features that don't work in Expo Go — like fingerprint / Face unlock sign-in — will work here.

You need a free Expo account: sign up at https://expo.dev/signup if you don't have one.

## 1. Log in to Expo (in the Shell)

```bash
cd artifacts/mobile
npx eas-cli login
```

Enter your Expo account email and password when asked.

## 2. Start the build

```bash
npx eas-cli build --profile preview --platform android
```

- The first time, EAS will ask to create a project on your account and to generate an Android signing keystore — answer **yes** to both.
- The build runs on Expo's servers (no cost on the free tier, but there can be a queue). It usually takes 10–25 minutes.

## 3. Download the APK

When the build finishes, the Shell prints a link like `https://expo.dev/accounts/<you>/projects/mobile/builds/...`.

- Open that link (or go to expo.dev → your project → Builds).
- Click **Download** to get the `.apk` file, or scan the QR code shown there directly with your Android phone.

## 4. Install on your Android phone

1. Open the download link (or transfer the APK) on your phone and tap the `.apk` file.
2. Android will warn about installing apps from outside the Play Store — tap **Settings** and allow **Install unknown apps** for your browser, then go back and tap **Install**.
3. Open **HIVE Companion™** from your home screen.
4. Sign in with your password once, then turn on **Biometric Sign-In** in Settings → Security.

## Later: Play Store build

When you're ready for the Play Store, run the production profile instead — it produces an `.aab` bundle for store submission:

```bash
npx eas-cli build --profile production --platform android
```
