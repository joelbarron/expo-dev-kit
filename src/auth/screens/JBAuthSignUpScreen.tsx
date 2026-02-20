import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useForm } from 'react-hook-form';

import { getLastCreatedJBExpoConfig } from '../../config';
import { JBSocialProviderName } from '../../config/types';
import { JBFormButton, JBFormPicker, JBSelectOption } from '../../forms';
import { useAppConfigStore } from '../../runtime';
import { Box, Button, ButtonText, Text, VStack } from '../../ui';
import { authenticateWithExpoSocialProvider } from '../expo';
import { JBAuthSignUpForm } from '../forms';
import { useJBAuth } from '../provider';
import { LoginSocialPayload, RegisterPayload } from '../types';
import { shouldSelectRoleForSocialLogin } from '../utils';
import { AuthScreenLayout, JBAuthAlert, JBAuthSocialActions } from '../ui';
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
  const [showEmailSignUp, setShowEmailSignUp] = useState(false);
  const authConfig = (appConfig?.auth ?? baseConfig?.auth ?? {}) as any;
  const minimumSignUpAge = Number(authConfig?.signUp?.minimumAge ?? 18);
  const signUpRoleOptions = useMemo<Array<JBSelectOption<string> & { allowSignup?: boolean }>>(
    () =>
      (authConfig?.profileRoles ?? [])
        .filter((roleOption: any) => roleOption?.allowSignup !== false)
        .map((roleOption: any) => ({
          value: roleOption.value,
          label: roleOption.label,
          allowSignup: roleOption.allowSignup
        })),
    [authConfig?.profileRoles]
  );
  const defaultSignUpRole = authConfig?.defaultProfileRole ?? signUpRoleOptions[0]?.value;
  const debugSignUp = appConfig?.userDebug?.signUp ?? baseConfig?.userDebug?.signUp ?? {};
  const socialConfig = authConfig?.social ?? {};
  const showDebugSocial = Boolean(authConfig?.showDebugSocial ?? false);
  const socialRoleOptions = useMemo<Array<JBSelectOption<string>>>(
    () => signUpRoleOptions.map((roleOption) => ({ value: roleOption.value, label: roleOption.label })),
    [signUpRoleOptions]
  );
  const hasRoleOptions = socialRoleOptions.length > 0;
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
  const [pendingSocialPayload, setPendingSocialPayload] = useState<LoginSocialPayload | null>(null);
  const rolePickerOpenRef = useRef<(() => void) | null>(null);
  const { control: socialRoleControl } = useForm<{ role?: JBSelectOption<string> | string }>({
    mode: 'onChange',
    defaultValues: {
      role: socialRoleOptions.find((roleOption) => roleOption.value === defaultSignUpRole)
    }
  });
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
        const tokenPayload = socialAuthenticator
          ? await socialAuthenticator(provider)
          : await authenticateWithExpoSocialProvider(
              provider as JBSocialProviderName,
              socialConfig?.[provider],
              showDebugSocial,
              { strategy: socialConfig?.strategy }
            );
        if (!tokenPayload) {
          return;
        }
        const baseSocialPayload: LoginSocialPayload = {
          ...tokenPayload,
          provider,
          client: 'mobile',
          termsAndConditionsAccepted: true
        };
        const precheckResponse = await auth.signInSocialPrecheck(baseSocialPayload);
        const shouldSelectRole = shouldSelectRoleForSocialLogin(precheckResponse, hasRoleOptions);
        if (shouldSelectRole) {
          setPendingSocialPayload(baseSocialPayload);
          rolePickerOpenRef.current?.();
          return;
        }
        setIsSocialLoading(true);
        await auth.signInSocial(baseSocialPayload);
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
    [auth, navigator, showDebugSocial, socialAuthenticator, socialConfig, hasRoleOptions]
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
            loading={showEmailSignUp ? formState.isLoading : false}
            isDisabled={showEmailSignUp ? !formState.canSubmit : false}
            onPress={showEmailSignUp ? formState.submit : () => setShowEmailSignUp(true)}
          />

          <Button
            variant="link"
            action="primary"
            size="sm"
            className="self-center px-0"
            onPress={navigator.goToSignIn}
          >
            <ButtonText className="text-sm">¿Ya tienes cuenta? Iniciar sesión</ButtonText>
          </Button>
        </VStack>
      )}
    >
      {createdEmail ? <JBAuthAlert type="success" message="Cuenta creada. Verifica tu correo para activar tu cuenta." /> : null}

      <JBAuthSocialActions
        googleEnabled={hasProvider("google")}
        showApple={Platform.OS === "ios"}
        appleEnabled={Platform.OS === "ios" && hasProvider("apple")}
        facebookEnabled={hasProvider("facebook")}
        isSocialLoading={isSocialLoading}
        onGooglePress={() => signInWithProvider("google")}
        onApplePress={() => signInWithProvider("apple")}
        onFacebookPress={() => signInWithProvider("facebook")}
        showSms={false}
      />

      <VStack className="my-4 w-full items-center" space="xs">
        <Box className="w-full flex-row items-center">
          <Box className="h-px flex-1 bg-outline-700" />
          <Text className="px-3 text-sm text-muted">o</Text>
          <Box className="h-px flex-1 bg-outline-700" />
        </Box>
        <JBFormButton
          variant="outline"
          action="secondary"
          size="lg"
          className="w-full"
          buttonType="email"
          text="Crear cuenta con email"
          showIcon={false}
          onPress={() => setShowEmailSignUp(true)}
        />
      </VStack>

      {showEmailSignUp ? (
        <JBAuthSignUpForm
          defaultValues={signUpDefaultValues}
          roleOptions={signUpRoleOptions}
          defaultRole={defaultSignUpRole}
          minimumAge={minimumSignUpAge}
          showSubmitButton={false}
          onFormStateChange={handleFormStateChange}
          onSubmit={handleSignUpSubmit}
        />
      ) : null}
      {hasRoleOptions ? (
        <Box className="h-0 w-0 overflow-hidden">
          <JBFormPicker
            control={socialRoleControl}
            fieldName="role"
            label="Rol"
            items={socialRoleOptions}
            sheetTitle="Selecciona un rol para continuar"
            renderTrigger={({ open }) => {
              rolePickerOpenRef.current = open;
              return <Box className="h-0 w-0" />;
            }}
            onChangeCustom={(option: JBSelectOption<string>, onChange: (value: unknown) => void) => {
              onChange(option);
              if (!pendingSocialPayload) {
                return;
              }
              const roleValue = typeof option === 'string' ? option : option?.value;
              const pendingPayload = pendingSocialPayload;
              setPendingSocialPayload(null);
              void (async () => {
                try {
                  setIsSocialLoading(true);
                  await auth.signInSocial({
                    ...pendingPayload,
                    role: roleValue ?? defaultSignUpRole
                  });
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
              })();
            }}
          />
        </Box>
      ) : null}
    </AuthScreenLayout>
  );
}
