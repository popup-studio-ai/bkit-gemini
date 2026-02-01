---
name: mobile-app
description: |
  Mobile app development guide for cross-platform apps.
  Covers React Native, Flutter, and Expo frameworks.

  Use proactively when user wants to build mobile apps.

  Triggers: mobile app, React Native, Flutter, Expo, iOS, Android,
  모바일 앱, 앱 개발,
  モバイルアプリ, アプリ開発,
  移动应用, 手机应用,
  aplicación móvil, app móvil,
  application mobile, app mobile,
  mobile Anwendung, mobile App,
  applicazione mobile, app mobile

  Do NOT use for: web-only projects, desktop apps
---

# Mobile App Skill

> Build cross-platform mobile applications

## Frameworks

### React Native + Expo (Recommended)

```bash
# Create new Expo project
npx create-expo-app my-app
cd my-app
npx expo start
```

**Pros:**
- JavaScript/TypeScript
- Hot reloading
- Expo SDK for native features
- Web support

### Flutter

```bash
# Create new Flutter project
flutter create my_app
cd my_app
flutter run
```

**Pros:**
- Dart language
- Custom UI rendering
- Excellent performance
- Material & Cupertino widgets

## Project Structure (Expo)

```
my-app/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx
│   └── +not-found.tsx
├── components/
├── hooks/
├── constants/
└── assets/
```

## Key Considerations

### Navigation

```typescript
// Using Expo Router
import { Link } from 'expo-router';

export default function Home() {
  return (
    <Link href="/settings">
      Go to Settings
    </Link>
  );
}
```

### Native Features

```typescript
// Camera access
import { Camera } from 'expo-camera';

// Location
import * as Location from 'expo-location';

// Notifications
import * as Notifications from 'expo-notifications';
```

### State Management

- Zustand (simple)
- Redux Toolkit (complex)
- React Query (server state)

## Deployment

- **iOS**: App Store Connect
- **Android**: Google Play Console
- **Both**: Expo EAS Build

```bash
# Build for both platforms
eas build --platform all
```
