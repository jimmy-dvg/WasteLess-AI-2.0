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

## Scripts

- `npm run start` - start Expo
- `npm run android` - start on Android
- `npm run ios` - start on iOS
- `npm run web` - start Expo web
- `npm run lint` - run ESLint
- `npm run test` - run Vitest
- `npm run test:coverage` - run coverage

## Structure

- `src/app` - Expo Router routes
- `src/features` - feature screens, API clients, hooks, and components
- `src/services` - shared API and auth services
- `src/components` - reusable mobile UI components
- `src/assets/images` - Expo app icons, splash, and favicon assets

The starter reset script and unused React logo images have been removed so this workspace reflects the WasteLessAI product rather than the Expo template.
