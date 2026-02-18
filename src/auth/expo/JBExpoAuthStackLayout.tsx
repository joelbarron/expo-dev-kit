import { Entypo } from '@expo/vector-icons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { TouchableOpacity, View, Text } from 'react-native';

export type JBExpoAuthStackLayoutProps = {
  isAuthenticated: boolean;
  redirectHref?: string;
  headerBackgroundColor?: string;
  headerTintColor?: string;
  stage?: string;
  hideStageBadgeOnProduction?: boolean;
};

export function JBExpoAuthStackLayout(props: JBExpoAuthStackLayoutProps) {
  const {
    isAuthenticated,
    redirectHref = '/',
    headerBackgroundColor = '#111827',
    headerTintColor = 'white',
    stage = 'PRODUCTION',
    hideStageBadgeOnProduction = true
  } = props;
  const router = useRouter();

  if (isAuthenticated) {
    return <Redirect href={redirectHref as any} />;
  }

  const shouldShowStageBadge = !(hideStageBadgeOnProduction && stage === 'PRODUCTION');

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
        headerRight: () => {
          if (!shouldShowStageBadge) {
            return null;
          }
          return (
            <View
              style={{
                marginRight: 16,
                marginBottom: 12,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#1d4ed8',
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 12
              }}
            >
              <Text style={{ color: 'white', fontSize: 16 }}>STAGE: {stage}</Text>
            </View>
          );
        }
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen
        name="sign-in"
        options={{ headerShown: true, title: 'Iniciar sesión' }}
      />
      <Stack.Screen name="sign-up" options={{ headerShown: true }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: true }} />
      <Stack.Screen name="reset-password" options={{ headerShown: true }} />
      <Stack.Screen name="verify-email" options={{ headerShown: true }} />
      <Stack.Screen name="sign-out" options={{ headerShown: false }} />
    </Stack>
  );
}
