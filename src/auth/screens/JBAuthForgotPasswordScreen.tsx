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
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace de recuperación"
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
            variant="outline"
            action="primary"
            size="xl"
            className="mt-3 px-4"
            iconName="login"
            text="Regresar a iniciar sesión"
            onPress={navigator.goToSignIn}
          />
        </>
      )}
    >
      <JBAuthForgotPasswordForm
        showSubmitButton={false}
        onFormStateChange={handleFormStateChange}
        onSubmit={(values) => auth.requestPasswordReset(values)}
      />
    </AuthScreenLayout>
  );
}
