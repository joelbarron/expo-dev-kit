import { useEffect } from 'react';

import { useJBAuth } from '../provider';
import { Loading } from '../../shared';
import { AuthScreenLayout } from '../ui';
import { JBAuthNavigator } from './types';

export type JBAuthSignOutScreenProps = {
  navigator: JBAuthNavigator;
};

export function JBAuthSignOutScreen(props: JBAuthSignOutScreenProps) {
  const { navigator } = props;
  const auth = useJBAuth();

  useEffect(() => {
    auth.signOut().finally(() => {
      if (navigator.onSignedOut) {
        navigator.onSignedOut();
        return;
      }
      navigator.goToSignIn();
    });
  }, []);

  return (
    <AuthScreenLayout useMainLayout contentAlign="center">
      <Loading />
    </AuthScreenLayout>
  );
}
