import { useCallback, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

import { getLastCreatedJBExpoConfig } from "../../config";
import { JBSocialProviderName } from "../../config/types";
import { JBFormButton, JBFormPicker, JBSelectOption } from "../../forms";
import { useAppConfigStore } from "../../runtime";
import { Box, Button, ButtonText, Text, VStack } from "../../ui";
import { authenticateWithExpoSocialProvider } from "../expo";
import { JBAuthOtpSignInForm, JBAuthPasswordSignInForm } from "../forms";
import { useJBAuth } from "../provider";
import { LoginSocialPayload } from "../types";
import {
  AuthScreenLayout,
  JBAuthSocialActions,
} from "../ui";
import { shouldSelectRoleForSocialLogin } from "../utils";
import { JBAuthNavigator } from "./types";

export type JBAuthSignInScreenProps = {
  navigator: JBAuthNavigator;
  enableOtp?: boolean;
  initialMode?: "password" | "otp";
  socialProviders?: string[];
  socialAuthenticator?: (
    provider: string,
  ) => Promise<LoginSocialPayload | null>;
};

export function JBAuthSignInScreen(props: JBAuthSignInScreenProps) {
  const {
    navigator,
    enableOtp = true,
    initialMode = "password",
    socialProviders,
    socialAuthenticator,
  } = props;
  const auth = useJBAuth();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const baseConfig = getLastCreatedJBExpoConfig();
  const isConfigDebug = Boolean(appConfig?.debug ?? baseConfig.debug);
  const [mode, setMode] = useState<"password" | "otp">(initialMode);
  const [showCredentialsForm, setShowCredentialsForm] = useState(true);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const authConfig = (appConfig?.auth ?? baseConfig?.auth ?? {}) as any;
  const socialConfig = authConfig?.social ?? {};
  const socialRoleOptions = useMemo<Array<JBSelectOption<string>>>(
    () =>
      (authConfig?.profileRoles ?? [])
        .filter((roleOption: any) => roleOption?.allowSignup !== false)
        .map((roleOption: any) => ({ value: roleOption.value, label: roleOption.label })),
    [authConfig?.profileRoles]
  );
  const defaultSocialRole = authConfig?.defaultProfileRole ?? socialRoleOptions[0]?.value;
  const hasRoleOptions = socialRoleOptions.length > 0;
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
    if (provider !== "google") {
      return Boolean(providerConfig.clientId?.trim());
    }
    const platformClientId =
      Platform.OS === "ios"
        ? providerConfig.iosClientId
        : Platform.OS === "android"
          ? providerConfig.androidClientId
          : undefined;
    return Boolean(platformClientId?.trim() || providerConfig.clientId?.trim());
  };
  const configuredSocialProviders = (["google", "apple", "facebook"] as JBSocialProviderName[]).filter(
    (provider) =>
      provider !== "apple" || Platform.OS === "ios"
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
  const debugLogin = appConfig?.userDebug?.login ?? baseConfig.userDebug?.login ?? "";
  const debugPassword = appConfig?.userDebug?.password ?? baseConfig.userDebug?.password ?? "";
  const signInDefaultValues =
    isConfigDebug && (debugLogin || debugPassword)
      ? {
          login: debugLogin,
          password: debugPassword,
        }
      : undefined;
  const rolePickerOpenRef = useRef<(() => void) | null>(null);
  const [pendingSocialPayload, setPendingSocialPayload] = useState<LoginSocialPayload | null>(null);
  const { control: socialRoleControl } = useForm<{ role?: JBSelectOption<string> | string }>({
    mode: "onChange",
    defaultValues: {
      role: socialRoleOptions.find((roleOption) => roleOption.value === defaultSocialRole)
    }
  });

  const completeSocialLogin = useCallback(
    async (payload: LoginSocialPayload, role?: string) => {
      try {
        setIsSocialLoading(true);
        await auth.signInSocial({
          ...payload,
          role: role ?? payload.role
        });
        navigator.onSignedIn?.();
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Error de autenticación",
          text2: error?.message || "No se pudo iniciar sesión con el proveedor social."
        });
      } finally {
        setIsSocialLoading(false);
      }
    },
    [auth, navigator]
  );
  const handlePasswordSignIn = useCallback(
    async (values: { login: string; password: string }) => {
      await auth.signIn(values);
      navigator.onSignedIn?.();
    },
    [auth, navigator]
  );
  const handleOtpRequest = useCallback(
    (values: { phone: string }) =>
      auth.requestOtp({ phone: values.phone, channel: "sms" }),
    [auth]
  );
  const handleOtpVerify = useCallback(
    async (values: { phone: string; code: string; role?: string }) => {
      await auth.signInOtp({
        phone: values.phone,
        code: values.code,
        channel: "sms",
        role: values.role,
        client: "mobile",
      });
      navigator.onSignedIn?.();
    },
    [auth, navigator]
  );

  const signInWithProvider = async (provider: string) => {
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
        client: "mobile",
        termsAndConditionsAccepted: true
      };
      const precheckResponse = await auth.signInSocialPrecheck(baseSocialPayload);
      const shouldSelectRole = shouldSelectRoleForSocialLogin(precheckResponse, hasRoleOptions);
      if (shouldSelectRole) {
        setPendingSocialPayload(baseSocialPayload);
        rolePickerOpenRef.current?.();
        return;
      }
      await completeSocialLogin(baseSocialPayload);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error de autenticación",
        text2: error?.message || "No se pudo iniciar sesión con el proveedor social."
      });
    }
  };
  const [passwordFormState, setPasswordFormState] = useState<{
    submit: () => void;
    canSubmit: boolean;
    isLoading: boolean;
  }>({
    submit: () => {},
    canSubmit: false,
    isLoading: false,
  });
  const onPasswordFormStateChange = useCallback(
    ({ submit, canSubmit, isLoading }: { submit: () => void; canSubmit: boolean; isLoading: boolean }) => {
      setPasswordFormState((prev) => {
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

  const passwordFooter = (
    <VStack space="md" className="pt-6">
      <JBFormButton
        variant="solid"
        size="xl"
        className="px-4"
        buttonType="email"
        text="Iniciar sesión"
        loading={passwordFormState.isLoading}
        isDisabled={!passwordFormState.canSubmit}
        onPress={passwordFormState.submit}
      />

      <Button
        variant="link"
        action="primary"
        size="sm"
        className="self-center px-0"
        onPress={navigator.goToSignUp}
      >
        <ButtonText className="text-sm">
          ¿No tienes cuenta? Crear cuenta
        </ButtonText>
      </Button>
    </VStack>
  );

  return (
    <AuthScreenLayout
      footer={mode === "password" ? passwordFooter : undefined}
      footerAdjustableHeight={mode === "password"}
      footerClassName={mode === "password" ? "pt-4 pb-6" : undefined}
      contentAlign="top"
    >
      <JBAuthSocialActions
        title="Acceso rápido"
        googleEnabled={hasProvider("google")}
        showApple={Platform.OS === "ios"}
        appleEnabled={Platform.OS === "ios" && hasProvider("apple")}
        facebookEnabled={hasProvider("facebook")}
        smsEnabled={enableOtp}
        smsActive={mode === "otp"}
        isSocialLoading={isSocialLoading}
        onGooglePress={() => signInWithProvider("google")}
        onApplePress={() => signInWithProvider("apple")}
        onFacebookPress={() => signInWithProvider("facebook")}
        onSmsPress={() => {
          setMode("otp");
          setShowCredentialsForm(true);
        }}
      />

      <VStack className="mb-4 mt-8 w-full items-center" space="xs">
        <Box className="w-full flex-row items-center">
          <Box className="h-px flex-1 bg-outline-700" />
          <Text size="xl" className="px-3 text-center text-primary-500">
            O usar email y contraseña
          </Text>
          <Box className="h-px flex-1 bg-outline-700" />
        </Box>
      </VStack>

      {showCredentialsForm && mode === "password" ? (
        <Box className="w-full">
          <JBAuthPasswordSignInForm
            defaultValues={signInDefaultValues}
            showSubmitButton={false}
            showForgotPasswordLink={false}
            onFormStateChange={onPasswordFormStateChange}
            onPressVerifyAccount={(email) =>
              navigator.goToVerifyEmail?.({ email })
            }
            onSubmit={handlePasswordSignIn}
          />
        </Box>
      ) : showCredentialsForm ? (
        <Box className="w-full">
          <JBAuthOtpSignInForm
            onRequestOtp={handleOtpRequest}
            onVerifyOtp={handleOtpVerify}
          />
        </Box>
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
              const roleValue = typeof option === "string" ? option : option?.value;
              const pendingPayload = pendingSocialPayload;
              setPendingSocialPayload(null);
              void completeSocialLogin(pendingPayload, roleValue ?? defaultSocialRole);
            }}
          />
        </Box>
      ) : null}
    </AuthScreenLayout>
  );
}
