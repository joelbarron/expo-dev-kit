# Expo Router auth integration

The library exposes `JBAuth*Screen` components.
In Expo Router, each route must exist as a file inside `app/(auth)`.

## Suggested routes

- `app/(auth)/welcome.tsx`
- `app/(auth)/sign-in.tsx`
- `app/(auth)/sign-up.tsx`
- `app/(auth)/forgot-password.tsx`
- `app/(auth)/reset-password.tsx`
- `app/(auth)/verify-email.tsx`
- `app/(auth)/sign-out.tsx`

## Navigator helper

```tsx
import { useRouter } from 'expo-router';

export function useAuthNavigator() {
  const router = useRouter();

  return {
    goToSignIn: () => router.replace('/(auth)/sign-in'),
    goToSignUp: () => router.push('/(auth)/sign-up'),
    goToForgotPassword: () => router.push('/(auth)/forgot-password'),
    goToResetPassword: (params?: { uid?: string; token?: string }) =>
      router.push({ pathname: '/(auth)/reset-password', params }),
    goToVerifyEmail: (params?: { email?: string; uid?: string; token?: string }) =>
      router.push({ pathname: '/(auth)/verify-email', params }),
    goToWelcome: () => router.replace('/(auth)/welcome'),
    onSignedIn: () => router.replace('/(app)'),
    onSignedOut: () => router.replace('/(auth)/sign-in')
  };
}
```

## Per-screen example

```tsx
// app/(auth)/sign-in.tsx
import { JBAuthSignInScreen } from '@joelbarron/expo-dev-kit/auth';
import { useAuthNavigator } from '@/hooks/useAuthNavigator';

export default function Screen() {
  const navigator = useAuthNavigator();
  return <JBAuthSignInScreen navigator={navigator} enableOtp />;
}
```

```tsx
// app/(auth)/sign-up.tsx
import { JBAuthSignUpScreen } from '@joelbarron/expo-dev-kit/auth';
import { useAuthNavigator } from '@/hooks/useAuthNavigator';

export default function Screen() {
  const navigator = useAuthNavigator();
  return <JBAuthSignUpScreen navigator={navigator} />;
}
```

```tsx
// app/(auth)/forgot-password.tsx
import { JBAuthForgotPasswordScreen } from '@joelbarron/expo-dev-kit/auth';
import { useAuthNavigator } from '@/hooks/useAuthNavigator';

export default function Screen() {
  const navigator = useAuthNavigator();
  return <JBAuthForgotPasswordScreen navigator={navigator} />;
}
```

```tsx
// app/(auth)/reset-password.tsx
import { useLocalSearchParams } from 'expo-router';
import { JBAuthResetPasswordScreen } from '@joelbarron/expo-dev-kit/auth';
import { useAuthNavigator } from '@/hooks/useAuthNavigator';

export default function Screen() {
  const navigator = useAuthNavigator();
  const params = useLocalSearchParams<{ uid?: string; token?: string }>();
  return <JBAuthResetPasswordScreen navigator={navigator} uid={params.uid} token={params.token} />;
}
```

```tsx
// app/(auth)/verify-email.tsx
import { useLocalSearchParams } from 'expo-router';
import { JBAuthAccountConfirmationScreen } from '@joelbarron/expo-dev-kit/auth';
import { useAuthNavigator } from '@/hooks/useAuthNavigator';

export default function Screen() {
  const navigator = useAuthNavigator();
  const params = useLocalSearchParams<{ uid?: string; token?: string; email?: string }>();
  return (
    <JBAuthAccountConfirmationScreen
      navigator={navigator}
      uid={params.uid}
      token={params.token}
      email={params.email}
    />
  );
}
```

```tsx
// app/(auth)/welcome.tsx
import { JBAuthWelcomeScreen } from '@joelbarron/expo-dev-kit/auth';
import { useAuthNavigator } from '@/hooks/useAuthNavigator';

export default function Screen() {
  const navigator = useAuthNavigator();
  return <JBAuthWelcomeScreen navigator={navigator} />;
}
```

```tsx
// app/(auth)/sign-out.tsx
import { JBAuthSignOutScreen } from '@joelbarron/expo-dev-kit/auth';
import { useAuthNavigator } from '@/hooks/useAuthNavigator';

export default function Screen() {
  const navigator = useAuthNavigator();
  return <JBAuthSignOutScreen navigator={navigator} />;
}
```
