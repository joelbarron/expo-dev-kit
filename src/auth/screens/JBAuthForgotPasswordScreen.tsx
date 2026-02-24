import { useCallback, useState } from 'react';

import { JBFormButton } from '../../forms';
import { JBAuthForgotPasswordForm } from '../forms';
import { useJBAuth } from '../provider';
import { AuthScreenLayout } from '../ui';
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

  return (
    <AuthScreenLayout
      subtitle="Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña."
      footerAdjustableHeight
      footerClassName="pt-4 pb-6"
      footer={(
        <>
          <JBFormButton
            variant="solid"
            action="primary"
            size="xl"
            className="px-4"
            buttonType="email"
            text="Enviar enlace de recuperación"
            loading={formState.isLoading}
            isDisabled={!formState.canSubmit}
            onPress={formState.submit}
          />
          <JBFormButton
            variant="link"
            action="primary"
            size="sm"
            className="mt-2 self-center px-0"
            text="Regresar a iniciar sesión"
            textClassName="text-sm font-medium text-primary-600 dark:text-primary-300"
            onPress={() => {
              if (navigator.goToSignInPassword) {
                navigator.goToSignInPassword();
                return;
              }
              navigator.goToSignIn({ initialMode: 'password' });
            }}
          />
        </>
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
