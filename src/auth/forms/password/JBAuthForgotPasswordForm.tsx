import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { JBFormInput } from '../../../forms';
import { JBAuthAlert, JBAuthPrimaryButton } from '../../ui';
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

  const submitForm = async (values: JBAuthForgotPasswordFormValues) => {
    try {
      setSuccess(null);
      const response = await onSubmit(values);
      const emailSent = getEmailSentFlag(response);

      setSuccessType(emailSent === false ? 'warning' : 'success');
      setSuccess(emailSent === false ? notSentMessage : successMessage);
      setIsEmailSentSuccessfully(emailSent === true);
      if (emailSent === true) {
        setResendSecondsLeft(resendCooldownSeconds);
        onEmailSentSuccess?.();
      }
    } catch (error) {
      const parsed = parseAuthError(error);
      if (parsed.fieldErrors.email) {
        setError('email', { type: 'manual', message: parsed.fieldErrors.email });
      }

      setError('root', {
        type: 'manual',
        message: parsed.rootMessage || 'No se pudo enviar el correo de recuperación. Inténtalo de nuevo.'
      });
    }
  };

  return (
    <>
      {formState.errors.root?.message ? <JBAuthAlert type="error" message={formState.errors.root.message} /> : null}
      {success ? <JBAuthAlert type={successType} message={success} /> : null}

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

      <JBAuthPrimaryButton
        label={isResendCooldownActive ? `${resendLabel} (${resendSecondsLeft}s)` : isEmailSentSuccessfully ? resendLabel : submitLabel}
        loading={isLoading}
        disabled={isResendCooldownActive || !email?.trim() || !formState.isValid}
        onPress={handleSubmit(submitForm)}
      />
    </>
  );
}
