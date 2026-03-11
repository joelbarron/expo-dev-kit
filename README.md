# @joelbarron/expo-dev-kit

Reusable core for Expo/React Native apps.

Includes:
- `auth`: client, secure storage, provider/context, query hooks, auth forms, and auth screens (`JB*`).
- `forms`: base fields with web-style prefixes (`JBTextField`, `JBSelectField`, `JBCheckboxField`).
- `query`: query client with centralized 401 handling.
- `core/app-status`: maintenance + required update handling.

## Included auth flows

- Password sign-in.
- OTP sign-in.
- Sign up.
- Forgot password.
- Reset password confirmation (uid/token).
- Account confirmation + resend.
- Sign out.
- Welcome.

## Expo Router (important)

Expo Router detects routes from files in the consumer app's `app/` directory.
This library provides components; your `app/` route files must still exist.

## `app/(auth)` route example

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

## App status (maintenance/update)

```tsx
import { JBAppStatusProvider, JBAppStatusGate, createAppStatusClient } from '@joelbarron/expo-dev-kit/core';

const appStatusClient = createAppStatusClient({
  baseUrl: 'https://api.example.com/v1',
  endpoint: '/core/configs/mobile/'
});
```

## Install the library (local or npm)

From this repo:

```bash
# Local (build + pack + install into finzenio-app)
npm run install:lib:local:finzenio

# NPM latest (build + install from registry)
npm run install:lib:npm:finzenio

# Generic
npm run install:lib -- --source local --target /path/to/your/app
npm run install:lib -- --source npm --target /path/to/your/app --tag latest
```

## Release automation

- CI workflow: `.github/workflows/ci.yml`
- Release workflow (OIDC + Changesets): `.github/workflows/release.yml`
- Release runbook: [docs/release.md](./docs/release.md)
