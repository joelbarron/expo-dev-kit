import { useCallback, useState } from "react";

import { getLastCreatedJBExpoConfig } from "../../config";
import { JBFormButton } from "../../forms";
import { useAppConfigStore } from "../../runtime";
import { Box, VStack } from "../../ui";
import { JBAuthPasswordSignInForm } from "../forms";
import { useJBAuth } from "../provider";
import { AuthScreenLayout } from "../ui";
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
  const debugLogin = appConfig?.userDebug?.login ?? baseConfig.userDebug?.login ?? "";
  const debugPassword = appConfig?.userDebug?.password ?? baseConfig.userDebug?.password ?? "";
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
            buttonType="email"
            text="Iniciar sesión"
            loading={formState.isLoading}
            isDisabled={!formState.canSubmit}
            onPress={formState.submit}
          />
          <JBFormButton
            variant="link"
            action="primary"
            size="sm"
            className="self-center px-0"
            text="¿No tienes cuenta? Crear cuenta"
            textClassName="text-sm font-medium text-primary-600 dark:text-primary-300"
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
