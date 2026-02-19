import { useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

import { JBAuthPrimaryButton, JBAuthSecondaryButton } from '../../ui';
import { parseAuthError } from '../errorParser';

export type JBAuthAccountConfirmationFormValues = {
  uid: string;
  token: string;
};

export type JBAuthAccountConfirmationFormProps = {
  defaultValues?: Partial<JBAuthAccountConfirmationFormValues>;
  defaultEmail?: string;
  onGoToSignIn?: () => void;
  resendCooldownSeconds?: number;
  signInRedirectSeconds?: number;
  autoSubmit?: boolean;
  onSubmit: (values: JBAuthAccountConfirmationFormValues) => unknown | Promise<unknown>;
  onResend?: (values: { email: string }) => unknown | Promise<unknown>;
};

export function JBAuthAccountConfirmationForm(props: JBAuthAccountConfirmationFormProps) {
  const {
    defaultValues,
    defaultEmail,
    onGoToSignIn,
    resendCooldownSeconds = 30,
    signInRedirectSeconds = 5,
    autoSubmit = true,
    onSubmit,
    onResend
  } = props;

  const uid = defaultValues?.uid ?? '';
  const token = defaultValues?.token ?? '';
  const email = defaultEmail?.trim() ?? '';
  const hasValues = Boolean(uid && token);

  const hasAutoSubmittedRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpiredVerificationError, setIsExpiredVerificationError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [signInRedirectCountdown, setSignInRedirectCountdown] = useState<number | null>(null);

  const canResendFromSignup = !hasValues && Boolean(email) && Boolean(onResend);
  const canResendFromExpiredLink = hasValues && isExpiredVerificationError && Boolean(email) && Boolean(onResend);

  const isExpiredMessage = (message: string) => {
    const normalized = message
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return normalized.includes('expir') || normalized.includes('invalid') || normalized.includes('invalido');
  };

  const submit = async () => {
    if (!hasValues) {
      setErrorMessage('El enlace no es válido o está incompleto.');
      Toast.show({
        type: 'error',
        text1: 'Error de verificación',
        text2: 'El enlace no es válido o está incompleto.'
      });
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setIsExpiredVerificationError(false);
      await onSubmit({ uid, token });
      setIsSuccess(true);
      setSignInRedirectCountdown(signInRedirectSeconds);
      Toast.show({
        type: 'success',
        text1: 'Cuenta verificada',
        text2: 'Tu cuenta fue verificada correctamente.'
      });
    } catch (error) {
      const parsed = parseAuthError(error);
      const resolved = parsed.rootMessage || 'No se pudo verificar la cuenta. El enlace puede haber expirado.';
      setErrorMessage(resolved);
      setIsExpiredVerificationError(isExpiredMessage(resolved));
      setIsSuccess(false);
      Toast.show({
        type: 'error',
        text1: 'Error de verificación',
        text2: resolved
      });
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!onResend || !email || resendCooldown > 0) {
      return;
    }

    try {
      setErrorMessage(null);
      setResendMessage(null);
      setResending(true);
      await onResend({ email });
      setResendMessage('Correo de verificación reenviado.');
      setResendCooldown(resendCooldownSeconds);
      Toast.show({
        type: 'success',
        text1: 'Correo reenviado',
        text2: 'Correo de verificación reenviado.'
      });
    } catch {
      setErrorMessage('No se pudo reenviar el correo de verificación.');
      Toast.show({
        type: 'error',
        text1: 'Error de verificación',
        text2: 'No se pudo reenviar el correo de verificación.'
      });
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setResendCooldown((currentValue) => Math.max(0, currentValue - 1));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [resendCooldown]);

  useEffect(() => {
    if (!isSuccess || !onGoToSignIn || signInRedirectCountdown === null || signInRedirectCountdown <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setSignInRedirectCountdown((current) => (current ? current - 1 : 0));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isSuccess, onGoToSignIn, signInRedirectCountdown]);

  useEffect(() => {
    if (isSuccess && onGoToSignIn && signInRedirectCountdown === 0) {
      onGoToSignIn();
    }
  }, [isSuccess, onGoToSignIn, signInRedirectCountdown]);

  useEffect(() => {
    if (!autoSubmit || !hasValues || hasAutoSubmittedRef.current) {
      return;
    }

    hasAutoSubmittedRef.current = true;
    void submit();
  }, [autoSubmit, hasValues, uid, token]);

  const formatCooldown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  return (
    <>
      {!isSuccess && hasValues && !canResendFromExpiredLink ? (
        <JBAuthPrimaryButton label="Reintentar verificación" loading={loading} onPress={() => void submit()} />
      ) : null}

      {canResendFromSignup ? (
        <>
          <JBAuthPrimaryButton label="Ir a iniciar sesión" onPress={onGoToSignIn} />
          <JBAuthSecondaryButton
            label={
              resending
                ? 'Reenviando...'
                : resendCooldown > 0
                  ? `Reenviar verificación (${formatCooldown(resendCooldown)})`
                  : 'Reenviar verificación'
            }
            disabled={resending || resendCooldown > 0}
            onPress={() => void resend()}
          />
        </>
      ) : null}

      {canResendFromExpiredLink ? (
        <JBAuthSecondaryButton
          label={
            resending
              ? 'Reenviando...'
              : resendCooldown > 0
                ? `Reenviar verificación (${formatCooldown(resendCooldown)})`
                : 'Reenviar verificación'
          }
          disabled={resending || resendCooldown > 0}
          onPress={() => void resend()}
        />
      ) : null}

      {isSuccess && !canResendFromSignup && !canResendFromExpiredLink ? (
        <JBAuthPrimaryButton
          label={`Ir a iniciar sesión${
            typeof signInRedirectCountdown === 'number' && signInRedirectCountdown > 0
              ? ` (${signInRedirectCountdown}s)`
              : ''
          }`}
          onPress={onGoToSignIn}
        />
      ) : null}
    </>
  );
}
