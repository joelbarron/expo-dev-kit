import { useCallback, useState } from 'react';

import { getLastCreatedJBExpoConfig } from '../../config';
import { useAppConfigStore } from '../../runtime';
import { VStack } from '../../ui';
import { JBAuthAccountConfirmationForm } from '../forms';
import { useJBAuth } from '../provider';
import { AuthScreenLayout, JBAuthFooterButton, JBAuthVerifyEmailVisual } from '../ui';
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
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const baseConfig = getLastCreatedJBExpoConfig();
  const verifyEmailVisualConfig =
    appConfig?.auth?.visuals?.verifyEmail ?? baseConfig.auth.visuals.verifyEmail;
  const handleGoToSignIn = useCallback(
    () => {
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
    },
    [navigator]
  );
  const handleConfirmAccountEmail = useCallback(
    (values: { uid: string; token: string }) => auth.confirmAccountEmail(values),
    [auth]
  );
  const handleResendAccountConfirmation = useCallback(
    (values: { email: string }) => auth.resendAccountConfirmation(values),
    [auth]
  );
  const [actionState, setActionState] = useState<{
    isSuccess: boolean;
    showRetryVerification: boolean;
    retryLabel: string;
    retryLoading: boolean;
    retryDisabled: boolean;
    onRetryVerification: () => void;
    showResend: boolean;
    resendLabel: string;
    resendLoading: boolean;
    resendDisabled: boolean;
    onResend: () => void;
    showGoToSignIn: boolean;
    goToSignInLabel: string;
    onGoToSignIn?: () => void;
  }>({
    isSuccess: false,
    showRetryVerification: false,
    retryLabel: 'Reintentar verificación',
    retryLoading: false,
    retryDisabled: false,
    onRetryVerification: () => {},
    showResend: false,
    resendLabel: 'Reenviar verificación',
    resendLoading: false,
    resendDisabled: false,
    onResend: () => {},
    showGoToSignIn: false,
    goToSignInLabel: 'Ir a iniciar sesión',
    onGoToSignIn: undefined
  });
  const handleActionStateChange = useCallback(
    (nextState: typeof actionState) => {
      setActionState((prev) => {
        if (
          prev.isSuccess === nextState.isSuccess &&
          prev.showRetryVerification === nextState.showRetryVerification &&
          prev.retryLabel === nextState.retryLabel &&
          prev.retryLoading === nextState.retryLoading &&
          prev.retryDisabled === nextState.retryDisabled &&
          prev.onRetryVerification === nextState.onRetryVerification &&
          prev.showResend === nextState.showResend &&
          prev.resendLabel === nextState.resendLabel &&
          prev.resendLoading === nextState.resendLoading &&
          prev.resendDisabled === nextState.resendDisabled &&
          prev.onResend === nextState.onResend &&
          prev.showGoToSignIn === nextState.showGoToSignIn &&
          prev.goToSignInLabel === nextState.goToSignInLabel &&
          prev.onGoToSignIn === nextState.onGoToSignIn
        ) {
          return prev;
        }
        return nextState;
      });
    },
    []
  );

  return (
    <AuthScreenLayout
      title="Verificar cuenta"
      subtitle="Revisa tu correo y abre el enlace de verificación para activar tu cuenta. Cuando termines, regresa aquí para continuar."
      footerAdjustableHeight
      footerClassName="pt-4 pb-6"
      footer={
        <VStack space="md">
          {actionState.showRetryVerification ? (
            <JBAuthFooterButton
              slot="primary"
              text={actionState.retryLabel}
              loading={actionState.retryLoading}
              isDisabled={actionState.retryDisabled}
              onPress={actionState.onRetryVerification}
            />
          ) : null}
          {actionState.showResend ? (
            <JBAuthFooterButton
              slot="primary"
              variant="outline"
              text={actionState.resendLabel}
              loading={actionState.resendLoading}
              isDisabled={actionState.resendDisabled}
              onPress={actionState.onResend}
            />
          ) : null}
          {actionState.showGoToSignIn ? (
            <JBAuthFooterButton
              slot="secondary"
              text={actionState.goToSignInLabel}
              onPress={actionState.onGoToSignIn ?? handleGoToSignIn}
            />
          ) : null}
        </VStack>
      }
    >
      {verifyEmailVisualConfig?.showAnimation ? (
        <JBAuthVerifyEmailVisual
          source={
            actionState.isSuccess
              ? verifyEmailVisualConfig?.successAnimationSource ??
                verifyEmailVisualConfig?.pendingAnimationSource ??
                verifyEmailVisualConfig?.animationSource
              : verifyEmailVisualConfig?.pendingAnimationSource ??
                verifyEmailVisualConfig?.animationSource
          }
          autoPlay={verifyEmailVisualConfig?.animationAutoPlay}
          loop={
            actionState.isSuccess
              ? (verifyEmailVisualConfig?.successAnimationLoop ?? false)
              : verifyEmailVisualConfig?.animationLoop
          }
          speed={verifyEmailVisualConfig?.animationSpeed}
          size={verifyEmailVisualConfig?.animationSize}
        />
      ) : null}
      <JBAuthAccountConfirmationForm
        defaultValues={{ uid, token }}
        defaultEmail={email}
        showActionButtons={false}
        onActionStateChange={handleActionStateChange}
        onGoToSignIn={handleGoToSignIn}
        onSubmit={handleConfirmAccountEmail}
        onResend={handleResendAccountConfirmation}
      />
    </AuthScreenLayout>
  );
}
