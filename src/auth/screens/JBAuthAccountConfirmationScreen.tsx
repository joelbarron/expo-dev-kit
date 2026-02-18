import { JBAuthAccountConfirmationForm } from '../forms';
import { useJBAuth } from '../provider';
import { AuthScreenLayout } from '../ui';
import { JBAuthNavigator } from './types';

export type JBAuthAccountConfirmationScreenProps = {
  navigator: JBAuthNavigator;
  uid?: string;
  token?: string;
  email?: string;
};

export function JBAuthAccountConfirmationScreen(props: JBAuthAccountConfirmationScreenProps) {
  const { navigator, uid = '', token = '', email } = props;
  const auth = useJBAuth();

  return (
    <AuthScreenLayout title="Verificar cuenta" subtitle="Confirma tu correo para iniciar sesión">
      <JBAuthAccountConfirmationForm
        defaultValues={{ uid, token }}
        defaultEmail={email}
        onGoToSignIn={navigator.goToSignIn}
        onSubmit={(values) => auth.confirmAccountEmail(values)}
        onResend={(values) => auth.resendAccountConfirmation(values)}
      />
    </AuthScreenLayout>
  );
}
