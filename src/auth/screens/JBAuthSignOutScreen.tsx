import { useEffect } from 'react';

import { useJBAuth } from '../provider';
import { AuthScreenLayout, JBAuthAlert, JBAuthPrimaryButton } from '../ui';
import { JBAuthNavigator } from './types';

export type JBAuthSignOutScreenProps = {
  navigator: JBAuthNavigator;
};

export function JBAuthSignOutScreen(props: JBAuthSignOutScreenProps) {
  const { navigator } = props;
  const auth = useJBAuth();

  useEffect(() => {
    auth.signOut().then(() => {
      navigator.onSignedOut?.();
      navigator.goToSignIn();
    });
  }, []);

  return (
    <AuthScreenLayout title="Cerrando sesión">
      <JBAuthAlert type="info" message="Cerrando sesión..." />
      <JBAuthPrimaryButton
        label="Ir a iniciar sesión"
        onPress={() => {
          navigator.goToSignIn();
        }}
      />
    </AuthScreenLayout>
  );
}
