import { Entypo } from '@expo/vector-icons';
import { Redirect, Stack, usePathname, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { getAuthRoutesConfig, getLastCreatedJBExpoConfig } from '../../config';
import { useAppConfigStore } from '../../runtime';

export type JBExpoAuthStackLayoutProps = {
  isAuthenticated: boolean;
  redirectHref?: string;
  headerBackgroundColor?: string;
  headerTintColor?: string;
};

export function JBExpoAuthStackLayout(props: JBExpoAuthStackLayoutProps) {
  const {
    isAuthenticated,
    redirectHref = '/',
    headerBackgroundColor = '#111827',
    headerTintColor = 'white'
  } = props;
  const router = useRouter();
  const pathname = usePathname();
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        auth: {
          ...baseConfig.auth,
          ...(appConfig?.auth ?? {}),
        },
      } as any),
    [appConfig?.auth, baseConfig],
  );
  const authRoutes = useMemo(
    () => getAuthRoutesConfig(mergedConfig),
    [mergedConfig],
  );
  const isSignOutRoute =
    pathname === authRoutes.signOut || pathname.endsWith(authRoutes.signOut);

  if (isAuthenticated && !isSignOutRoute) {
    return <Redirect href={redirectHref as any} />;
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor,
        headerBackTitle: ' ',
        title: '',
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: headerBackgroundColor
        },
        headerLeft: () => (
          <View>
            <TouchableOpacity onPress={router.back}>
              <Entypo name="chevron-small-left" size={40} color={headerTintColor} />
            </TouchableOpacity>
          </View>
        ),
        headerRight: () => null
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen
        name="auth-entry"
        options={{ headerShown: true, title: 'Comenzar' }}
      />
      <Stack.Screen
        name="sign-in-password"
        options={{ headerShown: true, title: 'Iniciar sesión' }}
      />
      <Stack.Screen
        name="sign-in-otp"
        options={{ headerShown: true, title: 'Continuar con SMS' }}
      />
      <Stack.Screen name="sign-up-form" options={{ headerShown: true, title: 'Crear cuenta' }} />
      <Stack.Screen
        name="forgot-password"
        options={{ headerShown: true, title: "Recuperar contraseña" }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          headerShown: true,
          gestureEnabled: false,
          headerLeft: () => (
            <View>
              <TouchableOpacity
                onPress={() => router.replace(authRoutes.signInPassword as any)}
              >
                <Entypo name="chevron-small-left" size={40} color={headerTintColor} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="verify-email"
        options={{
          headerShown: true,
          gestureEnabled: false,
          headerLeft: () => (
            <View>
              <TouchableOpacity
                onPress={() => router.replace(authRoutes.signInPassword as any)}
              >
                <Entypo name="chevron-small-left" size={40} color={headerTintColor} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Stack.Screen name="sign-out" options={{ headerShown: false }} />
    </Stack>
  );
}
