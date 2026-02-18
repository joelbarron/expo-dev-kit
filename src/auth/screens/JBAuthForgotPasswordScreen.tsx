import { JBAuthForgotPasswordForm } from '../forms';
import { useJBAuth } from '../provider';
import { AuthScreenLayout, JBAuthSecondaryButton } from '../ui';
import { JBAuthNavigator } from './types';

export type JBAuthForgotPasswordScreenProps = {
  navigator: JBAuthNavigator;
};

export function JBAuthForgotPasswordScreen(props: JBAuthForgotPasswordScreenProps) {
  const { navigator } = props;
  const auth = useJBAuth();

  return (
    <AuthScreenLayout title="Recuperar contraseña" subtitle="Te enviaremos un enlace de recuperación">
      <JBAuthForgotPasswordForm
        onSubmit={(values) => auth.requestPasswordReset(values)}
      />

      <JBAuthSecondaryButton label="Regresar a iniciar sesión" onPress={navigator.goToSignIn} />
    </AuthScreenLayout>
  );
}
