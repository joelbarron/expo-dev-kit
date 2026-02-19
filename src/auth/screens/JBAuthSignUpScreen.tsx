import { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

import { getLastCreatedJBExpoConfig } from '../../config';
import { JBSocialProviderName } from '../../config/types';
import { JBFormButton } from '../../forms';
import { useAppConfigStore } from '../../runtime';
import { VStack } from '../../ui';
import { getColor } from '../../utils';
import { authenticateWithExpoSocialProvider } from '../expo';
import { JBAuthSignUpForm } from '../forms';
import { useJBAuth } from '../provider';
import { LoginSocialPayload, RegisterPayload } from '../types';
import { AuthScreenLayout, JBAuthAlert, JBAuthSocialFooterActions } from '../ui';
import { JBAuthNavigator } from './types';

export type JBAuthSignUpScreenProps = {
  navigator: JBAuthNavigator;
  socialProviders?: string[];
  socialAuthenticator?: (
    provider: string,
  ) => Promise<LoginSocialPayload | null>;
};

export function JBAuthSignUpScreen(props: JBAuthSignUpScreenProps) {
  const { navigator, socialProviders, socialAuthenticator } = props;
  const auth = useJBAuth();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const baseConfig = getLastCreatedJBExpoConfig();
  const isConfigDebug = Boolean(appConfig?.debug ?? baseConfig?.debug);
  const primaryColor = getColor('primary') ?? {};
  const authConfig = (appConfig?.auth ?? baseConfig?.auth ?? {}) as any;
  const minimumSignUpAge = Number(authConfig?.signUp?.minimumAge ?? 18);
  const debugSignUp = appConfig?.userDebug?.signUp ?? baseConfig?.userDebug?.signUp ?? {};
  const socialConfig = authConfig?.social ?? {};
  const showDebugSocial = Boolean(authConfig?.showDebugSocial ?? false);
  const hasSocialClientIdForCurrentPlatform = (
    provider: JBSocialProviderName,
    providerConfig?: {
      clientId?: string;
      iosClientId?: string;
      androidClientId?: string;
    }
  ) => {
    if (!providerConfig) {
      return false;
    }
    if (provider !== 'google') {
      return Boolean(providerConfig.clientId?.trim());
    }
    const platformClientId =
      Platform.OS === 'ios'
        ? providerConfig.iosClientId
        : Platform.OS === 'android'
          ? providerConfig.androidClientId
          : undefined;
    return Boolean(platformClientId?.trim() || providerConfig.clientId?.trim());
  };
  const configuredSocialProviders = (["google", "apple", "facebook"] as JBSocialProviderName[]).filter(
    (provider) =>
      provider !== 'apple' || Platform.OS === 'ios'
        ? Boolean(socialConfig?.[provider]?.enabled && hasSocialClientIdForCurrentPlatform(provider, socialConfig?.[provider]))
        : false
  );
  const normalizedSocialProviders = (
    socialProviders?.length ? socialProviders : configuredSocialProviders
  )
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider) => ["google", "apple", "facebook"].includes(provider));
  const hasProvider = (provider: string) =>
    normalizedSocialProviders.includes(provider);
  const signUpDefaultValues = useMemo(() => {
    if (!isConfigDebug) {
      return undefined;
    }

    const birthday =
      typeof debugSignUp?.birthday === 'string' && debugSignUp.birthday
        ? new Date(debugSignUp.birthday)
        : undefined;
    const hasDebugData = Boolean(
      debugSignUp?.firstName ||
      debugSignUp?.lastName1 ||
      debugSignUp?.email ||
      debugSignUp?.password
    );
    if (!hasDebugData) {
      return undefined;
    }

    return {
      firstName: debugSignUp?.firstName ?? '',
      lastName1: debugSignUp?.lastName1 ?? '',
      lastName2: debugSignUp?.lastName2 ?? '',
      email: debugSignUp?.email ?? '',
      birthday: birthday && !Number.isNaN(birthday.getTime()) ? birthday : undefined,
      gender: debugSignUp?.gender,
      role: debugSignUp?.role,
      password: debugSignUp?.password ?? '',
      passwordConfirm: debugSignUp?.passwordConfirm ?? debugSignUp?.password ?? '',
      acceptTermsConditions: Boolean(debugSignUp?.acceptTermsConditions ?? false)
    };
  }, [debugSignUp, isConfigDebug]);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const handleSignUpSubmit = useCallback(
    async (values: RegisterPayload) => {
      await auth.signUp(values);
      setCreatedEmail(values.email);
      navigator.goToVerifyEmail?.({ email: values.email });
    },
    [auth, navigator]
  );
  const [formState, setFormState] = useState<{
    submit: () => void;
    canSubmit: boolean;
    isLoading: boolean;
  }>({
    submit: () => {},
    canSubmit: false,
    isLoading: false
  });
  const handleFormStateChange = useCallback(
    ({ submit, canSubmit, isLoading }: { submit: () => void; canSubmit: boolean; isLoading: boolean }) => {
      setFormState((prev) => {
        if (
          prev.submit === submit &&
          prev.canSubmit === canSubmit &&
          prev.isLoading === isLoading
        ) {
          return prev;
        }
        return { submit, canSubmit, isLoading };
      });
    },
    []
  );
  const signInWithProvider = useCallback(
    async (provider: string) => {
      try {
        const payload = socialAuthenticator
          ? await socialAuthenticator(provider)
          : await authenticateWithExpoSocialProvider(
              provider as JBSocialProviderName,
              socialConfig?.[provider],
              showDebugSocial
            );
        if (!payload) {
          return;
        }
        setIsSocialLoading(true);
        await auth.signInSocial(payload);
        navigator.onSignedIn?.();
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error de autenticación',
          text2: error?.message || 'No se pudo iniciar sesión con el proveedor social.'
        });
      } finally {
        setIsSocialLoading(false);
      }
    },
    [auth, navigator, showDebugSocial, socialAuthenticator, socialConfig]
  );

  return (
    <AuthScreenLayout
      footerAdjustableHeight
      footerClassName="pt-4 pb-6"
      footer={(
        <VStack space="md" className="pt-2">
          <JBFormButton
            variant="solid"
            action="primary"
            size="xl"
            className="px-4"
            buttonType="add"
            text="Crear cuenta"
            loading={formState.isLoading}
            isDisabled={!formState.canSubmit}
            onPress={formState.submit}
          />
          <JBFormButton
            variant="outline"
            action="primary"
            size="xl"
            className="px-4"
            iconName="login"
            text="Ya tengo cuenta"
            iconColor={primaryColor[500] ?? "#10b981"}
            textClassName="text-[14px] font-semibold text-primary-600 dark:text-primary-300"
            onPress={navigator.goToSignIn}
          />

          <JBAuthSocialFooterActions
            googleEnabled={hasProvider("google")}
            showApple={Platform.OS === "ios"}
            appleEnabled={Platform.OS === "ios" && hasProvider("apple")}
            facebookEnabled={hasProvider("facebook")}
            showSms
            smsEnabled
            isSocialLoading={isSocialLoading}
            onGooglePress={() => signInWithProvider("google")}
            onApplePress={() => signInWithProvider("apple")}
            onFacebookPress={() => signInWithProvider("facebook")}
            onSmsPress={navigator.goToSignIn}
          />
        </VStack>
      )}
    >
      {createdEmail ? <JBAuthAlert type="success" message="Cuenta creada. Verifica tu correo para activar tu cuenta." /> : null}

      <JBAuthSignUpForm
        defaultValues={signUpDefaultValues}
        minimumAge={minimumSignUpAge}
        showSubmitButton={false}
        onFormStateChange={handleFormStateChange}
        onSubmit={handleSignUpSubmit}
      />
    </AuthScreenLayout>
  );
}
