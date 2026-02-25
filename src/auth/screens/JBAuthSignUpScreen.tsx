import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useForm } from 'react-hook-form';

import { getLastCreatedJBExpoConfig } from '../../config';
import { JBSocialProviderName } from '../../config/types';
import { JBFormButton, JBFormPicker, JBSelectOption } from '../../forms';
import { useAppConfigStore } from '../../runtime';
import { Box, Text, VStack } from '../../ui';
import { getColor } from '../../utils';
import { authenticateWithExpoSocialProvider } from '../expo';
import { JBAuthSignUpForm } from '../forms';
import { useJBAuth } from '../provider';
import { LoginSocialPayload, RegisterPayload } from '../types';
import { shouldSelectRoleForSocialLogin } from '../utils';
import { AuthScreenLayout, JBAuthAlert, JBAuthSocialActions } from '../ui';
import { JBAuthNavigator } from './types';

export type JBAuthSignUpScreenProps = {
  navigator: JBAuthNavigator;
  screenVariant?: 'combined' | 'hub' | 'form';
  socialProviders?: string[];
  socialAuthenticator?: (
    provider: string,
  ) => Promise<LoginSocialPayload | null>;
};

export function JBAuthSignUpScreen(props: JBAuthSignUpScreenProps) {
  const { navigator, screenVariant = 'combined', socialProviders, socialAuthenticator } = props;
  const auth = useJBAuth();
  const primary = getColor("primary") ?? {};
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const baseConfig = getLastCreatedJBExpoConfig();
  const isConfigDebug = Boolean(appConfig?.debug ?? baseConfig?.debug);
  const [showEmailSignUp] = useState(true);
  const authConfig = (appConfig?.auth ?? baseConfig?.auth ?? {}) as any;
  const minimumSignUpAge = Number(authConfig?.signUp?.minimumAge ?? 18);
  const isRoleAllowedForSignup = (roleOption: any) =>
    roleOption?.allowSignup === true || roleOption?.allowSignUp === true;
  const signUpRoleOptions = useMemo<Array<JBSelectOption<string> & { allowSignup?: boolean }>>(
    () =>
      (authConfig?.profileRoles ?? [])
        .filter((roleOption: any) => isRoleAllowedForSignup(roleOption))
        .map((roleOption: any) => ({
          value: roleOption.value,
          label: roleOption.label,
          allowSignup: true
        })),
    [authConfig?.profileRoles]
  );
  const defaultSignUpRole =
    signUpRoleOptions.find((roleOption) => roleOption.value === authConfig?.defaultProfileRole)?.value ??
    signUpRoleOptions[0]?.value;
  const debugSignUp = appConfig?.userDebug?.signUp ?? baseConfig?.userDebug?.signUp ?? {};
  const socialConfig = authConfig?.social ?? {};
  const showDebugSocial = Boolean(authConfig?.showDebugSocial ?? false);
  const socialRoleOptions = useMemo<Array<JBSelectOption<string>>>(
    () => signUpRoleOptions.map((roleOption) => ({ value: roleOption.value, label: roleOption.label })),
    [signUpRoleOptions]
  );
  const hasRoleOptions = socialRoleOptions.length > 1;
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
      if (navigator.goToVerifyEmailReplace) {
        navigator.goToVerifyEmailReplace({ email: values.email });
      } else {
        navigator.goToVerifyEmail?.({ email: values.email });
      }
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
  const isHubVariant = screenVariant === 'hub';
  const isFormVariant = screenVariant === 'form';
  const isCombinedVariant = screenVariant === 'combined';
  const showSocialSection = isHubVariant || isCombinedVariant;
  const showFormSection = !isHubVariant;
  const showDivider = isCombinedVariant;
  const hubFooter = (
    <VStack space="md" className="pt-2">
      <JBFormButton
        variant="solid"
        action="primary"
        size="xl"
        className="px-4"
        buttonType="default"
        showIcon
        iconName="account-plus-outline"
        iconPosition="start"
        text="Crear cuenta"
        onPress={navigator.goToSignUpForm ?? navigator.goToSignUp}
      />

      <JBFormButton
        variant="link"
        action="primary"
        size="sm"
        className="self-center px-0"
        text="¿Ya tienes cuenta? Iniciar sesión"
        textClassName="text-sm font-medium text-primary-600 dark:text-primary-300"
        onPress={navigator.goToSignInPassword ?? (() => navigator.goToSignIn({ initialMode: 'password' }))}
      />
    </VStack>
  );
  const formFooter = (
    <VStack space="md" className="pt-2">
      <JBFormButton
        variant="solid"
        action="primary"
        size="xl"
        className="px-4"
        buttonType="default"
        showIcon
        iconName="account-plus-outline"
        iconPosition="start"
        text="Crear cuenta"
        loading={formState.isLoading}
        isDisabled={!formState.canSubmit}
        onPress={formState.submit}
      />

      <JBFormButton
        variant="link"
        action="primary"
        size="sm"
        className="self-center px-0"
        text="¿Ya tienes cuenta? Iniciar sesión"
        textClassName="text-sm font-medium text-primary-600 dark:text-primary-300"
        onPress={navigator.goToSignInPassword ?? (() => navigator.goToSignIn({ initialMode: 'password' }))}
      />
    </VStack>
  );

  return (
    <AuthScreenLayout
      footerAdjustableHeight
      footerClassName="pt-4 pb-6"
      footer={isHubVariant ? hubFooter : formFooter}
    >
      {createdEmail ? <JBAuthAlert type="success" message="Cuenta creada. Verifica tu correo para activar tu cuenta." /> : null}

      {showSocialSection ? (
        <JBAuthSocialActions
          title="Acceso rápido"
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
          onSmsPress={() => {
            if (navigator.goToSignInOtp) {
              navigator.goToSignInOtp();
            } else {
              navigator.goToSignIn({ initialMode: "otp" });
            }
          }}
        />
      ) : null}

      {showDivider ? (
        <VStack className="my-4 w-full items-center" space="xs">
          <Box className="w-full flex-row items-center">
            <Box className="h-px flex-1 bg-outline-700" />
            <Text
              size="xl"
              className="px-3 text-center"
              style={{ color: primary[500] ?? "#10b981" }}
            >
              O completa tus datos
            </Text>
            <Box className="h-px flex-1 bg-outline-700" />
          </Box>
        </VStack>
      ) : null}

      {showFormSection ? (
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
