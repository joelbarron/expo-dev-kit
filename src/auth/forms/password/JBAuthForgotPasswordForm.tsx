import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { JBFormInput } from '../../../forms';
import { JBAuthPrimaryButton } from '../../ui';
import { parseAuthError } from '../errorParser';

export type JBAuthForgotPasswordFormValues = {
  email: string;
};

export type JBAuthForgotPasswordFormProps = {
  defaultValues?: Partial<JBAuthForgotPasswordFormValues>;
  loading?: boolean;
  submitLabel?: string;
  resendLabel?: string;
  successMessage?: string;
  notSentMessage?: string;
  resendCooldownSeconds?: number;
  showSubmitButton?: boolean;
  onFormStateChange?: (state: {
    submit: () => void;
    canSubmit: boolean;
    isLoading: boolean;
  }) => void;
  onEmailSentSuccess?: () => void;
  onSubmit: (values: JBAuthForgotPasswordFormValues) => unknown | Promise<unknown>;
};

const forgotSchema = z.object({
  email: z.string().email('Debes ingresar un correo válido').nonempty('Debes ingresar un correo')
});

const getEmailSentFlag = (response: unknown): boolean | undefined => {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  const data = response as Record<string, unknown>;
  const emailSent = data.emailSent ?? data.email_sent;
  return typeof emailSent === 'boolean' ? emailSent : undefined;
};

export function JBAuthForgotPasswordForm(props: JBAuthForgotPasswordFormProps) {
  const {
    defaultValues,
    loading = false,
    submitLabel = 'Enviar enlace de recuperación',
    resendLabel = 'Reenviar enlace de recuperación',
    successMessage = 'Si la cuenta existe, enviamos un enlace de recuperación a tu correo.',
    notSentMessage = 'Solicitud recibida, pero no se pudo enviar el correo de recuperación.',
    resendCooldownSeconds = 30,
    showSubmitButton = true,
    onFormStateChange,
    onEmailSentSuccess,
    onSubmit
  } = props;

  const [success, setSuccess] = useState<string | null>(null);
  const [successType, setSuccessType] = useState<'success' | 'warning'>('success');
  const [isEmailSentSuccessfully, setIsEmailSentSuccessfully] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const { control, formState, handleSubmit, setError, clearErrors, watch } = useForm<JBAuthForgotPasswordFormValues>({
    mode: 'onChange',
    defaultValues: {
      email: defaultValues?.email ?? ''
    },
    resolver: zodResolver(forgotSchema)
  });

  const email = watch('email');
  const isLoading = loading || formState.isSubmitting;
  const isResendCooldownActive = isEmailSentSuccessfully && resendSecondsLeft > 0;

  useEffect(() => {
    if (!isResendCooldownActive) {
      return;
    }

    const timer = setInterval(() => {
      setResendSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isResendCooldownActive]);

  useEffect(() => {
    const subscription = watch((_value, meta) => {
      if (meta.name) {
        clearErrors(meta.name as keyof JBAuthForgotPasswordFormValues);
      }
      clearErrors('root');
    });

    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  const submitForm = useCallback(async (values: JBAuthForgotPasswordFormValues) => {
    try {
      setSuccess(null);
      const response = await onSubmit(values);
      const emailSent = getEmailSentFlag(response);

      setSuccessType(emailSent === false ? 'warning' : 'success');
      setSuccess(emailSent === false ? notSentMessage : successMessage);
      setIsEmailSentSuccessfully(emailSent === true);
      Toast.show({
        type: emailSent === false ? 'info' : 'success',
        text1: emailSent === false ? 'Solicitud procesada' : 'Correo enviado',
        text2: emailSent === false ? notSentMessage : successMessage
      });
      if (emailSent === true) {
        setResendSecondsLeft(resendCooldownSeconds);
        onEmailSentSuccess?.();
      }
    } catch (error) {
      const parsed = parseAuthError(error);
      if (parsed.fieldErrors.email) {
        setError('email', { type: 'manual', message: parsed.fieldErrors.email });
      }

      Toast.show({
        type: 'error',
        text1: 'Error de recuperación',
        text2: parsed.rootMessage || 'No se pudo enviar el correo de recuperación. Inténtalo de nuevo.'
      });
    }
  }, [
    onSubmit,
    notSentMessage,
    successMessage,
    resendCooldownSeconds,
    onEmailSentSuccess,
    setError
  ]);

  const submitHandler = useCallback(() => {
    void handleSubmit(submitForm)();
  }, [handleSubmit, submitForm]);

  useEffect(() => {
    onFormStateChange?.({
      submit: submitHandler,
      canSubmit: !(isResendCooldownActive || !email?.trim() || !formState.isValid),
      isLoading
    });
  }, [onFormStateChange, submitHandler, isResendCooldownActive, email, formState.isValid, isLoading]);

  return (
    <>
      {!isEmailSentSuccessfully ? (
        <JBFormInput
          control={control}
          fieldName="email"
          label="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          isDisabled={isLoading}
        />
      ) : null}

      {showSubmitButton ? (
        <JBAuthPrimaryButton
          label={isResendCooldownActive ? `${resendLabel} (${resendSecondsLeft}s)` : isEmailSentSuccessfully ? resendLabel : submitLabel}
          loading={isLoading}
          disabled={isResendCooldownActive || !email?.trim() || !formState.isValid}
          onPress={handleSubmit(submitForm)}
        />
      ) : null}
    </>
  );
}
