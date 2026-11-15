# Android standalone APK build

The Android native project is generated during CI from the Expo configuration and locked npm dependencies.

## Build

1. Open **Actions** in the GitHub repository.
2. Select **Android standalone release APK**.
3. Run the workflow on the branch containing the build you want to test (the current integration branch is `feat/production-readiness`), or use the automatic push trigger.
4. Wait for the job to finish successfully.
5. Download the `crush-android-standalone-release` artifact and extract `app-release.apk`.
6. Transfer the APK to the Android phone and install it.

The Gradle `assembleRelease` task invokes React Native/Expo release bundling. The JavaScript bundle and assets should be packaged into the APK, so the installed app should not need Metro or a development computer. A successful CI build is not a substitute for physical-device verification.

## Signing and intended use

This is a standalone release-mode test build, not a production-distribution signing setup. The generated Expo Android project uses its default debug keystore unless a private release signing configuration is supplied. The default CI keystore is ephemeral, so builds may not install as updates over APKs signed by another runner. Never commit a keystore or signing credentials.

## Product safety

This build does not remove CRUSH's authentication, trusted 18+ age-assurance, moderation, privacy or production-readiness launch gates. Do not invite public users or collect real identity documents until those gates are completed and independently tested.
