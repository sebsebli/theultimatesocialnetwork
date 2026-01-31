# Deep link verification files (citewalk.com → Expo app)

These files enable **Universal Links** (iOS) and **App Links** (Android) so that `https://citewalk.com/...` can open the Citewalk Expo app when installed.

## 1. iOS: `apple-app-site-association`

- Replace `YOUR_APPLE_TEAM_ID` with your [Apple Team ID](https://developer.apple.com/account/#/membership/) (e.g. `QQ57RJ5UTD`).
- Bundle ID is `com.citewalk.mobile` (must match `ios.bundleIdentifier` in `apps/mobile/app.json`).
- After editing, ensure the file is served at `https://citewalk.com/.well-known/apple-app-site-association` with `Content-Type: application/json` (already configured in `next.config.mjs`).
- Validate: [Branch AASA validator](https://branch.io/resources/aasa-validator/)

## 2. Android: `assetlinks.json`

- Replace `YOUR_SHA256_FINGERPRINT` with your app’s SHA256 certificate fingerprint:
  - **EAS Build:** run `eas credentials -p android`, select your profile, copy the value under “SHA256 Fingerprint” (format: `AA:BB:CC:...`).
  - **Play Console:** Release → Setup → App signing → “App signing key certificate” → SHA-256 certificate fingerprint.
- Package name `com.citewalk.mobile` must match `android.package` in `apps/mobile/app.json`.
- After deploying, verify: [Google’s Statement List Generator](https://developers.google.com/digital-asset-links/tools/generator) or open the URL in a browser and confirm JSON is returned.

## Rebuild

After changing these files, redeploy the web app. For iOS, users may need an app update from the App Store before the system re-fetches the AASA.
