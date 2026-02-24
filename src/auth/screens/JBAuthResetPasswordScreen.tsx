import { JBAuthPasswordResetConfirmForm } from '../forms';
import { useJBAuth } from '../provider';
import { AuthScreenLayout } from '../ui';
import { JBAuthNavigator } from './types';

export type JBAuthResetPasswordScreenProps = {
  navigator: JBAuthNavigator;
  uid?: string;
  token?: string;
};

export function JBAuthResetPasswordScreen(props: JBAuthResetPasswordScreenProps) {
  const { navigator, uid = '', token = '' } = props;
  const auth = useJBAuth();

  return (
    <AuthScreenLayout title="Restablecer contraseña" subtitle="Define una nueva contraseña">
      <JBAuthPasswordResetConfirmForm
        defaultValues={{ uid, token }}
        onGoToSignIn={
          navigator.goToSignInPasswordReplace ??
          navigator.goToSignInPassword ??
          (() => navigator.goToSignIn({ initialMode: 'password' }))
        }
        onSubmit={(values) =>
          auth.confirmPasswordReset({
            uid: values.uid,
            token: values.token,
            newPassword: values.newPassword,
            newPasswordConfirm: values.newPasswordConfirm
          })
        }
      />
    </AuthScreenLayout>
  );
}
