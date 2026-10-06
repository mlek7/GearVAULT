# Lightbag Store Release Guide (iOS App Store & Google Play)

This document provides exact step-by-step instructions to configure, build, sign, and upload **Lightbag** to the **Apple App Store** and **Google Play Console** using a Mac with Xcode and Android Studio.

---

## 1. Prerequisites on Your Mac

- **macOS Sonoma / Sequoia** with **Xcode 16+** (iOS 18 / iOS 26 SDK compatible)
- **CocoaPods** or Swift Package Manager (Capacitor 8 uses SPM by default)
- **Android Studio Ladybug / Meerkat** (JDK 21, Android SDK Platform 36, Build-Tools 36.0.0)
- **Node.js 20+** and **npm**

---

## 2. Firebase Native Setup (Critical for Native Auth)

The app uses `@capacitor-firebase/authentication` with native sign-in dialogs for Google and Apple, and Firebase Cloud Firestore for persistent storage.

### 2.1 Apple iOS Setup

1. **Download `GoogleService-Info.plist`**:
   - Go to [Firebase Console](https://console.firebase.google.com/) > Project `bionic-rigging-fmn89` (or your production project).
   - Add iOS App: Bundle ID `com.lightbag.app`.
   - Download `GoogleService-Info.plist`.
   - Move `GoogleService-Info.plist` into `ios/App/App/GoogleService-Info.plist`.
   - In Xcode, right-click the `App` group > **Add Files to "App"...** > select `GoogleService-Info.plist` > ensure **Copy items if needed** is checked and target **App** is selected.

2. **Add REVERSED_CLIENT_ID URL Scheme**:
   - Open `GoogleService-Info.plist` and copy the value of `REVERSED_CLIENT_ID` (e.g., `com.googleusercontent.apps.123456789-abcdef...`).
   - In Xcode, select the **App** project in the navigator > select the **App** target > go to the **Info** tab.
   - Expand **URL Types** at the bottom > click **+**.
   - Paste the `REVERSED_CLIENT_ID` into the **URL Schemes** field (Role: `Editor`).

3. **Enable "Sign in with Apple" Capability**:
   - In Xcode, select target **App** > **Signing & Capabilities** tab.
   - Click **+ Capability** in the top-left toolbar.
   - Double-click **Sign in with Apple**.

4. **Configure Apple Provider in Firebase Console**:
   - In Firebase Console > **Authentication** > **Sign-in method** > **Apple**.
   - Enable Apple provider.
   - Set Services ID, Apple Team ID, Key ID, and upload your Apple Private Key (`.p8`) generated in the Apple Developer Portal.

5. **Verify Privacy Manifest**:
   - `ios/App/App/PrivacyInfo.xcprivacy` is already included with:
     - No user tracking (`NSPrivacyTracking = false`).
     - Declared data types: Email, Name, Photos, Coarse Location (App Functionality only).
     - Required reason API: `NSPrivacyAccessedAPITypeUserDefaults` (`CA92.1`).
   - In `ios/App/App/Info.plist`, camera, photo library, location strings, and `ITSAppUsesNonExemptEncryption = false` are already configured.

### 2.2 Android Google Play Setup

1. **Download `google-services.json`**:
   - In Firebase Console > Add Android App.
   - Package Name: `com.lightbag.app`.
   - Download `google-services.json`.
   - Copy `google-services.json` to `android/app/google-services.json`.

2. **Add SHA-1 & SHA-256 Fingerprints**:
   - Generate your upload keystore (or use debug keystore for testing):
     ```bash
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```
   - For release keystore:
     ```bash
     keytool -list -v -keystore /path/to/lightbag-release-key.jks -alias lightbag
     ```
   - Copy the **SHA-1** and **SHA-256** fingerprints.
   - Go to Firebase Console > Project Settings > General > Your Android apps (`com.lightbag.app`) > click **Add fingerprint** > paste SHA-1 and SHA-256.
   - Note: If using Google Play App Signing, also copy the SHA-1/SHA-256 from Play Console > **App Integrity** and add them to Firebase!

---

## 3. Building and Preparing Assets

In the project root, run:

```bash
# 1. Build the web app and bundle
npm run build

# 2. (Optional) Re-generate native app icons and splash screens if you changed resources/
npm run assets

# 3. Sync web code and plugins to native iOS and Android projects
npm run cap:sync
```

---

## 4. iOS App Store Release (Xcode Archive)

### 4.1 Open the iOS Project

```bash
npm run cap:ios
# or: open ios/App/App.xcworkspace
```

### 4.2 Configure Signing & Version

1. In Xcode, select the **App** target > **Signing & Capabilities**.
2. Select your Apple Developer Team.
3. Ensure Bundle Identifier is `com.lightbag.app`.
4. Go to **General** tab:
   - Version: `1.0.0`
   - Build: `1` (increment with every upload)
   - Minimum Deployments: iOS 15.0 or 16.0+

### 4.3 Archive and Upload

1. Connect a generic device: in Xcode's top destination bar, select **Any iOS Device (arm64)**.
2. From the menu bar, select **Product** > **Archive**.
3. Once archiving completes, the **Organizer** window opens.
4. Click **Distribute App**.
5. Select **App Store Connect** > click **Next**.
6. Select **Upload** > click **Next**.
7. Keep standard distribution options checked (Symbols, Manage Version and Build Number) > click **Next**.
8. Select your distribution certificate and provisioning profile (or Automatic Signing).
9. Click **Upload**.
10. Wait for the upload to complete. Once finished, open [App Store Connect](https://appstoreconnect.apple.com/), select your build, fill in store metadata, and submit for review.

---

## 5. Google Play Release (Android Studio AAB)

### 5.1 Open the Android Project

```bash
npm run cap:android
```

### 5.2 Configure Release Keystore

Create a release keystore if you don't have one:

```bash
keytool -genkey -v -keystore lightbag-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias lightbag
```

Store this file safely outside the public repository.

### 5.3 Build Signed Android App Bundle (.aab)

**Via Android Studio:**
1. Open the project in Android Studio.
2. Wait for Gradle sync to finish.
3. Select **Build** > **Generate Signed Bundle / APK...**.
4. Choose **Android App Bundle** > click **Next**.
5. Choose your `lightbag-release.jks` keystore path, enter passwords, and select key alias `lightbag`.
6. Click **Next** > select build variant **release**.
7. Click **Create**.
8. The `.aab` file will be generated at `android/app/release/app-release.aab`.

**Or via Command Line:**
```bash
cd android
./gradlew bundleRelease
```

### 5.4 Upload to Google Play Console

1. Log into [Google Play Console](https://play.google.com/console).
2. Create or select application **Lightbag**.
3. Go to **Production** (or **Closed testing** / **Internal testing**) > **Create new release**.
4. Upload `app-release.aab`.
5. Provide release notes (e.g., "Initial 1.0.0 release of Lightbag gear vault and shoot planner").
6. Verify App Content declarations:
   - Privacy Policy URL: `https://aperture-app.ai.studio/privacy`
   - Location permissions: Coarse & Fine location used only during active session for golden hour & weather forecasts.
   - Camera permissions: used to photograph user's gear and moodboard references.
   - Account deletion: URL `https://aperture-app.ai.studio` and in-app button in Settings > Account > "Delete Account & Data".
7. Click **Save** > **Review release** > **Start rollout**.

---

## 6. App Store Listing Metadata Reference

- **App Name**: Lightbag
- **Subtitle**: Gear Vault & Shoot Planner
- **Category**: Photo & Video / Productivity
- **Privacy Policy URL**: `https://aperture-app.ai.studio/privacy`
- **Terms of Service URL**: `https://aperture-app.ai.studio/terms`
- **Support Email**: `melek.ben.moussa97@gmail.com`
- **Account Deletion Link**: In-app under Settings > Account > "Delete Account & Data", or email support.
