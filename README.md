# @joelbarron/expo-dev-kit

[![npm version](https://img.shields.io/npm/v/%40joelbarron%2Fexpo-dev-kit?label=npm&color=cb3837)](https://www.npmjs.com/package/@joelbarron/expo-dev-kit)
[![npm downloads](https://img.shields.io/npm/dm/%40joelbarron%2Fexpo-dev-kit?label=downloads)](https://www.npmjs.com/package/@joelbarron/expo-dev-kit)
[![CI](https://img.shields.io/github/actions/workflow/status/joelbarron/expo-dev-kit/ci.yml?branch=main&label=CI)](https://github.com/joelbarron/expo-dev-kit/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/actions/workflow/status/joelbarron/expo-dev-kit/release.yml?branch=main&label=release)](https://github.com/joelbarron/expo-dev-kit/actions/workflows/release.yml)

Reusable toolkit for Expo/React Native apps with ready-to-use auth flows, form components, query integration, and app status controls.

## What is included

| Module | Purpose |
| --- | --- |
| `auth` | API client, secure storage, context/provider, hooks, forms, and auth screens (`JB*`) |
| `forms` | Reusable input/select/checkbox and related form primitives |
| `query` | React Query setup with centralized unauthorized handling |
| `core/app-status` | Maintenance mode and required update checks |
| `config`, `runtime`, `http`, `store`, `services`, `ui`, `utils` | Shared mobile app building blocks |

## Auth flows available

- Password sign-in
- OTP sign-in
- Sign up
- Forgot password
- Reset password (uid/token)
- Account confirmation + resend
- Sign out
- Welcome

## Installation

```bash
npm i @joelbarron/expo-dev-kit
```

Main peer dependencies:
- `react >= 19`
- `react-native >= 0.76`
- `expo-router >= 6`
- `@tanstack/react-query >= 5`
- `react-hook-form >= 7`

## Quick start

### Expo Router auth screen example

Expo Router maps routes from the consumer app `app/` directory.  
This library gives you screen components; route files still live in the app.

```tsx
// app/(auth)/sign-in.tsx
import { useRouter } from 'expo-router';
import { JBAuthSignInScreen } from '@joelbarron/expo-dev-kit/auth';

export default function SignInRoute() {
  const router = useRouter();

  return (
    <JBAuthSignInScreen
      navigator={{
        goToSignIn: () => router.replace('/(auth)/sign-in'),
        goToSignUp: () => router.push('/(auth)/sign-up'),
        goToForgotPassword: () => router.push('/(auth)/forgot-password'),
        goToVerifyEmail: ({ email }) =>
          router.push({ pathname: '/(auth)/verify-email', params: email ? { email } : undefined }),
        onSignedIn: () => router.replace('/(app)')
      }}
    />
  );
}
```

### App status (maintenance/update)

```tsx
import { JBAppStatusProvider, JBAppStatusGate, createAppStatusClient } from '@joelbarron/expo-dev-kit/core';

const appStatusClient = createAppStatusClient({
  baseUrl: 'https://api.example.com/v1',
  endpoint: '/core/configs/mobile/'
});
```

## Local install helpers (for app integration testing)

From this repo:

```bash
# Local tarball install into finzenio-app
npm run install:lib:local:finzenio

# Install latest published npm version into finzenio-app
npm run install:lib:npm:finzenio

# Generic
npm run install:lib -- --source local --target /path/to/your/app
npm run install:lib -- --source npm --target /path/to/your/app --tag latest
```

## Release channels

- `latest`: stable releases from `main`
- `next`: rc prereleases from `next`

Check published version and dist-tags:

```bash
npm view @joelbarron/expo-dev-kit version dist-tags --json
```

## Docs

- Expo Router auth integration: [docs/expo-router-auth-integration.md](./docs/expo-router-auth-integration.md)
- Release runbook: [docs/release.md](./docs/release.md)
- Finzenio extraction map: [docs/finzenio-extraction-map.md](./docs/finzenio-extraction-map.md)
