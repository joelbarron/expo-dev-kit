import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { JBAuthForgotPasswordForm } from '../forms';
import { useJBAuth } from '../provider';
import { AuthScreenLayout, JBAuthFooterButton } from '../ui';
import { JBAuthNavigator } from './types';

export type JBAuthForgotPasswordScreenProps = {
  navigator: JBAuthNavigator;
};

export function JBAuthForgotPasswordScreen(props: JBAuthForgotPasswordScreenProps) {
  const { navigator } = props;
  const auth = useJBAuth();
  const handleForgotPasswordSubmit = useCallback(
    (values: { email: string }) => auth.requestPasswordReset(values),
    [auth]
  );
  const handleEmailSentSuccess = useCallback(() => {
    if (navigator.goToSignInPasswordReplace) {
      navigator.goToSignInPasswordReplace();
      return;
    }
    if (navigator.goToSignInReplace) {
      navigator.goToSignInReplace();
      return;
    }
    if (navigator.goToSignInPassword) {
      navigator.goToSignInPassword();
      return;
    }
    navigator.goToSignIn({ initialMode: 'password' });
  }, [navigator]);
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
        if (prev.submit === submit && prev.canSubmit === canSubmit && prev.isLoading === isLoading) {
          return prev;
        }
        return { submit, canSubmit, isLoading };
      });
    },
    []
  );
  const footerClassName = Platform.OS === "android" ? "pt-0 pb-1" : "pt-4 pb-6";

  return (
    <AuthScreenLayout
      subtitle="Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña."
      footerAdjustableHeight
      footerClassName={footerClassName}
      footer={(
        <JBAuthFooterButton
          slot="primary"
          buttonType="email"
          iconPosition="start"
          text="Enviar enlace de recuperación"
          loading={formState.isLoading}
          isDisabled={!formState.canSubmit}
          onPress={formState.submit}
        />
      )}
    >
      <JBAuthForgotPasswordForm
        showSubmitButton={false}
        onFormStateChange={handleFormStateChange}
        onEmailSentSuccess={handleEmailSentSuccess}
        onSubmit={handleForgotPasswordSubmit}
      />
    </AuthScreenLayout>
  );
}
