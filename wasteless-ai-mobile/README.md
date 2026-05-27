# WasteLessAI Mobile

This workspace contains the Expo mobile client for WasteLessAI. It is designed for quick inventory checks, scanning workflows, shopping list use, household visibility, and notifications while away from the desktop web app.

## Quick Start

```bash
npm install
npm -w wasteless-ai-mobile run start
```

For local API access, set:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## Live Links

- Mobile web preview: <https://wasteless-ai-mobile.vercel.app>
- Web app and API origin: <https://wasteless-ai-web.vercel.app>

## Scripts

- `npm run start` - start Expo
- `npm run android` - start on Android
- `npm run ios` - start on iOS
- `npm run web` - start Expo web
- `npm run export:web` - export the Expo web build to `dist`
- `npm run deploy:vercel` - deploy the Expo web build to Vercel
- `npm run build:android:apk` - build an installable Android APK with EAS
- `npm run build:android:aab` - build a Play Store Android App Bundle with EAS
- `npm run lint` - run ESLint
- `npm run test` - run Vitest
- `npm run test:coverage` - run coverage

## Vercel Web Preview

Vercel can host the Expo web export, but it does not create an Android or iOS app. Import this repository as a separate Vercel project for the mobile web preview and use:

```txt
Base directory: wasteless-ai-mobile
Build command: npm run export:web
Output directory: dist
```

The included `vercel.json` also proxies `/api/*` to the deployed web API and rewrites all other web routes to `index.html` so Expo Router routes work after refreshes.

Set `EXPO_PUBLIC_API_URL` in Vercel to the mobile deployment origin so API calls use the same-origin proxy, for example:

```env
EXPO_PUBLIC_API_URL=https://wasteless-ai-mobile.vercel.app
```

For CLI deployment from this workspace:

```bash
npm run deploy:vercel
```

## Android APK Build

The Android app uses package id `com.wastelessai.mobile`.

APK and app bundle builds embed the public API origin from `eas.json`:

```env
EXPO_PUBLIC_API_URL=https://wasteless-ai-web.vercel.app
```

To create an installable `.apk`:

```bash
npm -w wasteless-ai-mobile run build:android:apk
```

This uses the EAS `preview` profile in `eas.json`, configured with `android.buildType: "apk"`.

If this is the first EAS build for the project, sign in with Expo first:

```bash
npx --yes eas-cli login
```

Expo will generate or reuse Android signing credentials during the build.

## Structure

- `src/app` - Expo Router routes
- `src/features` - feature screens, API clients, hooks, and components
- `src/services` - shared API and auth services
- `src/components` - reusable mobile UI components
- `src/assets/images` - Expo app icons, splash, and favicon assets

The starter reset script and unused React logo images have been removed so this workspace reflects the WasteLessAI product rather than the Expo template.
