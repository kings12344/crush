# Expo SDK migration notes

Updated 14 November 2026 from Expo's official documentation. This note records migration-specific evidence for the CRUSH mobile project; it is not an Expo release guarantee or a production test result.

Expo recommends upgrading SDK versions one at a time so breakages can be isolated. Its official SDK 58 guide says to install the SDK version, align compatible dependencies with `npx expo install --fix`, and run `npx expo-doctor`. [1] [2]

SDK 58 is released and uses React Native 0.88. The changelog calls out the React Native Strict TypeScript API, removals of several deprecated React Native APIs, changes in Expo Router navigation behavior, and a new default for web output. The project should be checked for those changes before moving to SDK 58; its small current route files do not use the named removed APIs, but that observation is not a native build validation. [1] [2]

Expo Doctor on the intermediate SDK 56 project reported a Hermes V1 memory regression and advised moving to SDK 57 at Expo `57.0.9` or later (or React Native `0.86.2` or later) to get the fix. Therefore SDK 56 is a migration waypoint, not an acceptable final target. [3]

The SDK 56 schema rejected the former top-level native `expo.splash` property. Expo's SDK 56 splash docs recommend the `expo-splash-screen` config plugin for native splash settings; its plugin supports a background color and optional image. The project's previous splash had only a background color, so the compatible migration keeps that color without inventing a logo asset. [4] [5]

Expo Doctor also required the direct `react-native-worklets` peer used by the native animation dependency graph. Keep its peer-dependency check in the upgrade validation; a successful `npm install` alone is not enough. [2]

## CRUSH migration result

The project was upgraded sequentially through Expo SDK 56 and SDK 57 to SDK 58. The SDK 56 splash schema error was fixed using `expo-splash-screen`, preserving the former `#FFF5FA` background without adding an invented image. The direct `react-native-worklets` peer was added and TypeScript's deprecated `baseUrl` setting was removed.

The first SDK 58 install attempt hit npm `ERESOLVE` because the upgraded manifest was being reconciled against the stale SDK 57 lockfile and installed tree. The manifest and previous lockfile were backed up; `node_modules` and the stale lockfile were then removed, and a normal `npm install` generated a coherent SDK 58 lockfile without `--force` or `--legacy-peer-deps`. A subsequent clean `npm ci` reproduced the dependency tree.

As of 14 November 2026, TypeScript passes, `npx expo install --check` passes, Expo Doctor reports 20/20 checks, `npx expo config --type public` succeeds, and `npx expo export --platform web` succeeds. `npm audit` reports 3 moderate findings and no high or critical findings. Native iOS/Android builds, physical-device-only paths, and provider-backed features have not been validated; this is not a production-readiness sign-off.

## References

[1]: https://expo.dev/changelog/sdk-58 "Expo SDK 58 release notes"
[2]: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/ "Expo SDK upgrade walkthrough"
[3]: https://expo.dev/changelog/sdk-57#known-regressions "Expo SDK 57 known regressions"
[4]: https://docs.expo.dev/versions/v56.0.0/sdk/splash-screen/ "Expo SDK 56 SplashScreen documentation"
[5]: https://docs.expo.dev/versions/v56.0.0/config/app/ "Expo SDK 56 app configuration reference"
