import { useCallback, useState } from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

import { getLastCreatedJBExpoConfig } from "../../config";
import { JBSocialProviderName } from "../../config/types";
import { JBFormButton } from "../../forms";
import { useAppConfigStore } from "../../runtime";
import { Box, Button, ButtonText, VStack } from "../../ui";
import { getColor } from "../../utils";
import { authenticateWithExpoSocialProvider } from "../expo";
import { JBAuthOtpSignInForm, JBAuthPasswordSignInForm } from "../forms";
import { useJBAuth } from "../provider";
import { LoginSocialPayload } from "../types";
import {
  AuthScreenLayout,
  JBAuthSocialFooterActions,
} from "../ui";
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
  const primaryColor = getColor("primary") ?? {};
  const [mode, setMode] = useState<"password" | "otp">(initialMode);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const authConfig = (appConfig?.auth ?? baseConfig?.auth ?? {}) as any;
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
        type: "error",
        text1: "Error de autenticación",
        text2: error?.message || "No se pudo iniciar sesión con el proveedor social."
      });
    } finally {
      setIsSocialLoading(false);
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


      <JBFormButton
        variant="outline"
        action="primary"
        size="xl"
        className="px-4"
        buttonType="add"
        iconName="account-plus-outline"
        text="Crear cuenta"
        iconColor={primaryColor[500] ?? "#10b981"}
        textClassName="text-[14px] font-semibold text-primary-600 dark:text-primary-300"
        onPress={navigator.goToSignUp}
      />

       <Button
        variant="link"
        action="primary"
        size="md"
        className="self-center px-0"
        onPress={navigator.goToForgotPassword}
      >
        <ButtonText className="text-sm font-semibold text-primary-600 dark:text-primary-300">
          ¿Olvidaste tu contraseña?
        </ButtonText>
      </Button>

      <JBAuthSocialFooterActions
        googleEnabled={hasProvider("google")}
        showApple={Platform.OS === "ios"}
        appleEnabled={Platform.OS === "ios" && hasProvider("apple")}
        facebookEnabled={hasProvider("facebook")}
        smsEnabled={enableOtp}
        smsActive={mode === "otp"}
        isSocialLoading={isSocialLoading}
        smsColor={primaryColor[500] ?? "#10b981"}
        onGooglePress={() => signInWithProvider("google")}
        onApplePress={() => signInWithProvider("apple")}
        onFacebookPress={() => signInWithProvider("facebook")}
        onSmsPress={() => setMode("otp")}
      />
    </VStack>
  );

  return (
    <AuthScreenLayout
      footer={mode === "password" ? passwordFooter : undefined}
      footerAdjustableHeight={mode === "password"}
      footerClassName={mode === "password" ? "pt-4 pb-6" : undefined}
      contentAlign={mode === "password" ? "center" : "top"}
    >
      {mode === "password" ? (
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
      ) : (
        <Box className="w-full">
          <JBAuthOtpSignInForm
            onRequestOtp={handleOtpRequest}
            onVerifyOtp={handleOtpVerify}
          />
        </Box>
      )}
    </AuthScreenLayout>
  );
}
