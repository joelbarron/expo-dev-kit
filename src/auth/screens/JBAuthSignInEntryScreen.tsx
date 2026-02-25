import { useCallback, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Platform, ScrollView } from "react-native";
import Toast from "react-native-toast-message";

import { getLastCreatedJBExpoConfig } from "../../config";
import { JBSocialProviderName } from "../../config/types";
import { JBFormButton, JBFormPicker, JBSelectOption } from "../../forms";
import { useAppConfigStore } from "../../runtime";
import { Box, Text, VStack } from "../../ui";
import { authenticateWithExpoSocialProvider, useJBSocialDebugLogs } from "../expo";
import { useJBAuth } from "../provider";
import { LoginSocialPayload } from "../types";
import { AuthScreenLayout, JBAuthSocialActions } from "../ui";
import { shouldSelectRoleForSocialLogin } from "../utils";
import { JBAuthNavigator } from "./types";

export type JBAuthSignInEntryScreenProps = {
  navigator: JBAuthNavigator;
  enableOtp?: boolean;
  socialProviders?: string[];
  socialAuthenticator?: (provider: string) => Promise<LoginSocialPayload | null>;
};

export function JBAuthSignInEntryScreen(props: JBAuthSignInEntryScreenProps) {
  const { navigator, enableOtp = true, socialProviders, socialAuthenticator } = props;
  const auth = useJBAuth();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const baseConfig = getLastCreatedJBExpoConfig();
  const authConfig = {
    ...(baseConfig?.auth ?? {}),
    ...(appConfig?.auth ?? {}),
    social: {
      ...((baseConfig as any)?.auth?.social ?? {}),
      ...((appConfig as any)?.auth?.social ?? {}),
    },
  } as any;
  const socialConfig = authConfig?.social ?? {};
  const showDebugSocial = Boolean(authConfig?.showDebugSocial ?? false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [pendingSocialPayload, setPendingSocialPayload] = useState<LoginSocialPayload | null>(null);
  const rolePickerOpenRef = useRef<(() => void) | null>(null);
  const socialDebugLogs = useJBSocialDebugLogs();

  const isRoleAllowedForSignup = (roleOption: any) =>
    roleOption?.allowSignup === true || roleOption?.allowSignUp === true;

  const socialRoleOptions = useMemo<Array<JBSelectOption<string>>>(
    () =>
      (authConfig?.profileRoles ?? [])
        .filter((roleOption: any) => isRoleAllowedForSignup(roleOption))
        .map((roleOption: any) => ({ value: roleOption.value, label: roleOption.label })),
    [authConfig?.profileRoles]
  );

  const defaultSocialRole =
    socialRoleOptions.find((roleOption) => roleOption.value === authConfig?.defaultProfileRole)?.value ??
    socialRoleOptions[0]?.value;
  const hasRoleOptions = socialRoleOptions.length > 1;

  const { control: socialRoleControl } = useForm<{ role?: JBSelectOption<string> | string }>({
    mode: "onChange",
    defaultValues: {
      role: socialRoleOptions.find((roleOption) => roleOption.value === defaultSocialRole),
    },
  });

  const hasSocialClientIdForCurrentPlatform = (
    provider: JBSocialProviderName,
    providerConfig?: { clientId?: string; iosClientId?: string; androidClientId?: string }
  ) => {
    if (!providerConfig) return false;
    if (provider !== "google") return Boolean(providerConfig.clientId?.trim());
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
        ? Boolean(
            socialConfig?.[provider]?.enabled &&
              hasSocialClientIdForCurrentPlatform(provider, socialConfig?.[provider])
          )
        : false
  );

  const normalizedSocialProviders = (socialProviders?.length ? socialProviders : configuredSocialProviders)
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider) => ["google", "apple", "facebook"].includes(provider));

  const hasProvider = (provider: string) => normalizedSocialProviders.includes(provider);
  const debugLogItems = socialDebugLogs.items;

  const completeSocialLogin = useCallback(
    async (payload: LoginSocialPayload, role?: string) => {
      try {
        setIsSocialLoading(true);
        await auth.signInSocial({
          ...payload,
          role: role ?? payload.role,
        });
        navigator.onSignedIn?.();
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Error de autenticación",
          text2: error?.message || "No se pudo iniciar sesión con el proveedor social.",
        });
      } finally {
        setIsSocialLoading(false);
      }
    },
    [auth, navigator]
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
        if (!tokenPayload) return;

        const baseSocialPayload: LoginSocialPayload = {
          ...tokenPayload,
          provider,
          client: "mobile",
          termsAndConditionsAccepted: true,
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
          text2: error?.message || "No se pudo iniciar sesión con el proveedor social.",
        });
      }
    },
    [auth, completeSocialLogin, hasRoleOptions, showDebugSocial, socialAuthenticator, socialConfig]
  );

  return (
    <AuthScreenLayout
      footerAdjustableHeight
      footerClassName="pt-4 pb-6"
      footer={
        <VStack space="md" className="pt-6">
          <JBFormButton
            variant="solid"
            size="xl"
            className="px-4"
            buttonType="default"
            showIcon
            iconName="account-plus-outline"
            iconPosition="start"
            text="Crear cuenta con email"
            onPress={navigator.goToSignUpForm ?? navigator.goToSignUp}
          />
          <JBFormButton
            variant="link"
            action="primary"
            size="sm"
            className="self-center px-0"
            text="¿Ya tienes una cuenta? Iniciar sesión"
            textClassName="text-sm font-medium text-primary-600 dark:text-primary-300"
            onPress={navigator.goToSignInPassword ?? (() => navigator.goToSignIn({ initialMode: "password" }))}
          />
        </VStack>
      }
    >
      <JBAuthSocialActions
        title="Acceder con..."
        googleEnabled={hasProvider("google")}
        showApple={Platform.OS === "ios"}
        appleEnabled={Platform.OS === "ios" && hasProvider("apple")}
        facebookEnabled={hasProvider("facebook")}
        smsEnabled={enableOtp}
        isSocialLoading={isSocialLoading}
        onGooglePress={() => signInWithProvider("google")}
        onApplePress={() => signInWithProvider("apple")}
        onFacebookPress={() => signInWithProvider("facebook")}
        onSmsPress={() => {
          if (navigator.goToSignInOtp) navigator.goToSignInOtp();
          else navigator.goToSignIn({ initialMode: "otp" });
        }}
      />

      {showDebugSocial ? (
        <VStack space="xs" className="mt-4 rounded-xl border border-outline-200 bg-background-100 p-3">
          <Box className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-primary-600 dark:text-primary-300">
              {`Logs social auth (${debugLogItems.length})`}
            </Text>
            <JBFormButton
              variant="link"
              action="primary"
              size="sm"
              className="px-0"
              text="Limpiar"
              textClassName="text-xs font-medium text-primary-600 dark:text-primary-300"
              onPress={socialDebugLogs.clear}
              isDisabled={!debugLogItems.length}
            />
          </Box>
          <Box className="h-60 rounded-lg border border-outline-100 bg-background-50 px-2 py-2 dark:bg-background-200">
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {debugLogItems.length ? (
                <VStack space="xs">
                  {debugLogItems
                    .slice()
                    .reverse()
                    .map((item) => (
                      <Box key={item.id} className="rounded-md bg-background-0 px-2 py-1 dark:bg-background-300">
                        <Text className="text-[10px] font-medium text-typography-600 dark:text-typography-200">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </Text>
                        <Text className="text-xs text-typography-900 dark:text-white">
                          {item.message}
                        </Text>
                      </Box>
                    ))}
                </VStack>
              ) : (
                <Box className="py-4">
                  <Text className="text-xs text-typography-600 dark:text-typography-200">
                    Sin logs aún. Prueba Google / Facebook / Apple / SMS.
                  </Text>
                </Box>
              )}
            </ScrollView>
          </Box>
        </VStack>
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
              if (!pendingSocialPayload) return;
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
