import { Entypo } from '@expo/vector-icons';
import { Redirect, Stack, usePathname, useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';

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
  const isSignOutRoute = pathname === '/sign-out' || pathname.endsWith('/sign-out');

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
        name="sign-in"
        options={{ headerShown: true, title: 'Iniciar sesión' }}
      />
      <Stack.Screen name="sign-up" options={{ headerShown: true, title: 'Crear cuenta' }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: true }} />
      <Stack.Screen name="reset-password" options={{ headerShown: true }} />
      <Stack.Screen name="verify-email" options={{ headerShown: true }} />
      <Stack.Screen name="sign-out" options={{ headerShown: false }} />
    </Stack>
  );
}
