import { useCallback, useState } from "react";
import { Platform } from "react-native";

import { getLastCreatedJBExpoConfig } from "../../config";
import { useAppConfigStore } from "../../runtime";
import { Box, VStack } from "../../ui";
import { JBAuthPasswordSignInForm } from "../forms";
import { useJBAuth } from "../provider";
import { AuthScreenLayout, JBAuthFooterButton } from "../ui";
import { JBAuthNavigator } from "./types";

export type JBAuthSignInPasswordScreenProps = {
  navigator: JBAuthNavigator;
};

export function JBAuthSignInPasswordScreen(props: JBAuthSignInPasswordScreenProps) {
  const { navigator } = props;
  const auth = useJBAuth();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const baseConfig = getLastCreatedJBExpoConfig();
  const isConfigDebug = Boolean(appConfig?.debug ?? baseConfig.debug);
  const debugLogin = appConfig?.auth?.userDebug?.login ?? baseConfig.auth.userDebug?.login ?? "";
  const debugPassword =
    appConfig?.auth?.userDebug?.password ?? baseConfig.auth.userDebug?.password ?? "";
  const signInDefaultValues =
    isConfigDebug && (debugLogin || debugPassword)
      ? { login: debugLogin, password: debugPassword }
      : undefined;

  const [formState, setFormState] = useState({
    submit: () => {},
    canSubmit: false,
    isLoading: false,
  });

  const handlePasswordSignIn = useCallback(
    async (values: { login: string; password: string }) => {
      await auth.signIn(values);
      navigator.onSignedIn?.();
    },
    [auth, navigator]
  );

  const onPasswordFormStateChange = useCallback(
    ({ submit, canSubmit, isLoading }: { submit: () => void; canSubmit: boolean; isLoading: boolean }) => {
      setFormState((prev) =>
        prev.submit === submit && prev.canSubmit === canSubmit && prev.isLoading === isLoading
          ? prev
          : { submit, canSubmit, isLoading }
      );
    },
    []
  );
  const footerClassName = Platform.OS === "android" ? "pt-0 pb-1" : "pt-4 pb-6";

  return (
    <AuthScreenLayout
      footerAdjustableHeight
      footerClassName={footerClassName}
      footer={
        <VStack space="md" className="pt-6">
          <JBAuthFooterButton
            slot="primary"
            buttonType="email"
            iconPosition="start"
            text="Iniciar sesión"
            loading={formState.isLoading}
            isDisabled={!formState.canSubmit}
            onPress={formState.submit}
          />
          <JBAuthFooterButton
            slot="secondary"
            text="¿No tienes cuenta? Crear cuenta"
            onPress={navigator.goToSignUpForm ?? navigator.goToSignUp}
          />
        </VStack>
      }
    >
      <Box className="w-full">
        <JBAuthPasswordSignInForm
          defaultValues={signInDefaultValues}
          showSubmitButton={false}
          showForgotPasswordLink
          forgotPasswordLabel="¿Olvidaste tu contraseña? Restablecer"
          onPressForgotPassword={navigator.goToForgotPassword}
          onFormStateChange={onPasswordFormStateChange}
          onPressVerifyAccount={(email) => {
            if (navigator.goToVerifyEmailReplace) {
              navigator.goToVerifyEmailReplace({ email });
              return;
            }
            navigator.goToVerifyEmail?.({ email });
          }}
          onSubmit={handlePasswordSignIn}
        />
      </Box>
    </AuthScreenLayout>
  );
}
