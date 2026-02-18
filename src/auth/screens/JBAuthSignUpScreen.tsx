import { useState } from 'react';

import { JBAuthSignUpForm } from '../forms';
import { useJBAuth } from '../provider';
import { AuthScreenLayout, JBAuthAlert, JBAuthSecondaryButton } from '../ui';
import { JBAuthNavigator } from './types';

export type JBAuthSignUpScreenProps = {
  navigator: JBAuthNavigator;
};

export function JBAuthSignUpScreen(props: JBAuthSignUpScreenProps) {
  const { navigator } = props;
  const auth = useJBAuth();
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  return (
    <AuthScreenLayout title="Crear cuenta" subtitle="Regístrate para comenzar">
      {createdEmail ? <JBAuthAlert type="success" message="Cuenta creada. Verifica tu correo para activar tu cuenta." /> : null}

      <JBAuthSignUpForm
        onSubmit={async (values) => {
          await auth.signUp(values);
          setCreatedEmail(values.email);
          navigator.goToVerifyEmail?.({ email: values.email });
        }}
      />

      <JBAuthSecondaryButton label="Ya tengo cuenta" onPress={navigator.goToSignIn} />
    </AuthScreenLayout>
  );
}
