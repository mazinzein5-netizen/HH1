# Building the iOS App and Distributing via TestFlight

This guide walks you through getting HIVE Companion onto real iPhones with EAS Build and TestFlight. A TestFlight build is a real app build, so features that don't work in Expo Go — like Face ID / Touch ID sign-in — will work here.

## What you need first

1. **An Expo account** (free) — sign up at https://expo.dev/signup if you don't have one.
2. **An Apple Developer account** ($99/year) — this is required by Apple for any iOS distribution, including TestFlight.
   - Enroll at https://developer.apple.com/programs/enroll/
   - Use an Apple ID you control (it can be your personal one).
   - Choose **Individual** enrollment unless you have a registered company and want the app listed under the company name (then choose **Organization**, which needs a D-U-N-S number and takes longer to approve).
   - Approval usually takes 24–48 hours. You can't start the iOS build until it's active.

You do **not** need a Mac — EAS builds in the cloud and handles certificates and provisioning profiles for you.

## 1. Log in to Expo (in the Shell)

```bash
cd artifacts/mobile
npx eas-cli login
```

## 2. Start the iOS build

TestFlight requires an App Store–type build, so use the **production** profile:

```bash
npx eas-cli build --profile production --platform ios
```

- EAS will ask you to sign in with your **Apple ID** (the one on the Developer account). This lets it automatically:
  - register the bundle identifier `com.ibnceena.hivecompanion` on your account,
  - create the distribution certificate and provisioning profile.
  Answer **yes** when it offers to handle credentials for you.
- If your Apple ID has two-factor authentication (it should), you'll be asked for the code.
- The build runs on Expo's servers and usually takes 15–30 minutes.

## 3. Create the app record in App Store Connect (one-time)

While the build runs (or before), create the app entry Apple needs:

1. Go to https://appstoreconnect.apple.com → **My Apps** → **+** → **New App**.
2. Platform: **iOS**. Name: e.g. `HIVE Companion`. Language: English (UK).
3. Bundle ID: pick `com.ibnceena.hivecompanion` (it appears in the list after step 2 registers it — refresh if needed).
4. SKU: anything unique, e.g. `hive-companion-1`.

> Tip: `eas submit` (next step) can also create this record for you automatically — if it offers to, you can let it.

## 4. Upload the build to TestFlight

When the build finishes, submit it straight from the Shell:

```bash
npx eas-cli submit --platform ios --latest
```

- Sign in with your Apple ID again if asked. EAS uploads the build to App Store Connect.
- Apple then runs automated processing (usually 10–30 minutes). You'll get an email when the build is ready in TestFlight.
- The first build may ask you (in App Store Connect → TestFlight) a one-time **export compliance** question: the app uses only standard HTTPS encryption, so answer **Yes, standard encryption / exempt**.

## 5. Invite testers

In App Store Connect → your app → **TestFlight**:

- **Internal testing** (fastest, no Apple review): add up to 100 users who are members of your App Store Connect team. Create a group, tick the build, add testers by email. They get an invite immediately.
- **External testing** (up to 10,000 testers): create an external group and add tester emails, or enable a **public link** anyone can tap. The first external build needs a short Apple beta review (usually about a day).

## 6. Install on the iPhone

Testers:

1. Install the free **TestFlight** app from the App Store.
2. Open the invite email (or public link) on the iPhone and tap **Accept** / **Install**.
3. Open **HIVE Companion™** from the home screen.
4. Sign in with your password once, then turn on **Biometric Sign-In** in Settings → Security — Face ID / Touch ID will now work.

TestFlight builds expire after 90 days; upload a new build before then to keep testers going.

## Optional: iOS Simulator build (no Apple account needed)

If you just want to try the native build on a Mac's iOS Simulator without an Apple Developer account:

```bash
npx eas-cli build --profile preview --platform ios
```

This produces a simulator app (`.tar.gz`) you can drag into the Simulator. Note: biometric sign-in can be simulated (Features → Face ID) but this build cannot be installed on a real iPhone.

## Later: App Store release

When you're ready for a public App Store release, use the same production build — in App Store Connect fill in the app's listing (screenshots, description, privacy details), select the build, and submit for review.
