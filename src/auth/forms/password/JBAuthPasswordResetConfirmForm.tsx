import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { JBFormButton, JBFormPasswordInput } from '../../../forms';
import { parseAuthError } from '../errorParser';
import { getDjangoLikePasswordError } from './passwordValidation';

export type JBAuthPasswordResetConfirmFormValues = {
  uid: string;
  token: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type JBAuthPasswordResetConfirmFormProps = {
  defaultValues?: Partial<JBAuthPasswordResetConfirmFormValues>;
  loading?: boolean;
  submitLabel?: string;
  successMessage?: string;
  successRedirectSeconds?: number;
  onGoToSignIn?: () => void;
  onSubmit: (values: JBAuthPasswordResetConfirmFormValues) => unknown | Promise<unknown>;
};

const schema = z
  .object({
    uid: z.string().nonempty('El uid es obligatorio'),
    token: z.string().nonempty('El token es obligatorio'),
    newPassword: z.string().superRefine((value, ctx) => {
      const error = getDjangoLikePasswordError(value);
      if (error) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
      }
    }),
    newPasswordConfirm: z.string().nonempty('La confirmación de contraseña es obligatoria')
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: 'Las contraseñas deben coincidir',
    path: ['newPasswordConfirm']
  });

export function JBAuthPasswordResetConfirmForm(props: JBAuthPasswordResetConfirmFormProps) {
  const {
    defaultValues,
    loading = false,
    submitLabel = 'Restablecer contraseña',
    successMessage = 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.',
    successRedirectSeconds = 5,
    onGoToSignIn,
    onSubmit
  } = props;

  const [redirectSecondsLeft, setRedirectSecondsLeft] = useState<number | null>(null);

  const { control, formState, handleSubmit, setError, clearErrors, watch } = useForm<JBAuthPasswordResetConfirmFormValues>({
    mode: 'onChange',
    defaultValues: {
      uid: defaultValues?.uid ?? '',
      token: defaultValues?.token ?? '',
      newPassword: defaultValues?.newPassword ?? '',
      newPasswordConfirm: defaultValues?.newPasswordConfirm ?? ''
    },
    resolver: zodResolver(schema)
  });

  const uid = watch('uid');
  const token = watch('token');
  const hasValidRecoveryLink = Boolean(uid?.trim() && token?.trim());
  const isLoading = loading || formState.isSubmitting;

  const goToSignInLabel = useMemo(() => {
    if (!formState.isSubmitSuccessful || !redirectSecondsLeft || redirectSecondsLeft <= 0) {
      return 'Ir a iniciar sesión';
    }
    return `Ir a iniciar sesión (${redirectSecondsLeft}s)`;
  }, [formState.isSubmitSuccessful, redirectSecondsLeft]);

  useEffect(() => {
    const subscription = watch((_value, meta) => {
      if (meta.name) {
        clearErrors(meta.name as keyof JBAuthPasswordResetConfirmFormValues);
      }
      clearErrors('root');
    });

    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  useEffect(() => {
    if (!formState.isSubmitSuccessful || !onGoToSignIn) {
      setRedirectSecondsLeft(null);
      return;
    }

    setRedirectSecondsLeft(successRedirectSeconds);
    const timer = setInterval(() => {
      setRedirectSecondsLeft((current) => {
        if (!current || current <= 1) {
          clearInterval(timer);
          onGoToSignIn();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [formState.isSubmitSuccessful, onGoToSignIn, successRedirectSeconds]);

  const submitForm = async (values: JBAuthPasswordResetConfirmFormValues) => {
    try {
      await onSubmit(values);
      Toast.show({
        type: 'success',
        text1: 'Contraseña actualizada',
        text2: successMessage
      });
    } catch (error) {
      const parsed = parseAuthError(error);
      const rootMessage = parsed.rootMessage || Object.values(parsed.fieldErrors)[0];
      Toast.show({
        type: 'error',
        text1: 'Error de recuperación',
        text2: rootMessage || 'No se pudo restablecer la contraseña. Inténtalo de nuevo.'
      });
    }
  };

  useEffect(() => {
    if (!formState.isSubmitSuccessful || hasValidRecoveryLink) {
      return;
    }

    Toast.show({
      type: 'error',
      text1: 'Enlace inválido',
      text2: 'El enlace de recuperación es inválido o incompleto.'
    });
  }, [formState.isSubmitSuccessful, hasValidRecoveryLink]);

  return (
    <>
      {!formState.isSubmitSuccessful ? (
        <>
          <JBFormPasswordInput
            control={control}
            fieldName="newPassword"
            label="Nueva contraseña"
            isDisabled={isLoading}
            enforceDjangoLikeValidation
          />

          <JBFormPasswordInput
            control={control}
            fieldName="newPasswordConfirm"
            label="Confirmar nueva contraseña"
            isDisabled={isLoading}
          />

          <JBFormButton
            text={submitLabel}
            loading={isLoading}
            isDisabled={!formState.isValid || !hasValidRecoveryLink}
            onPress={handleSubmit(submitForm)}
          />
        </>
      ) : null}

      {formState.isSubmitSuccessful && onGoToSignIn ? (
        <JBFormButton
          variant="outline"
          action="primary"
          text={goToSignInLabel}
          onPress={onGoToSignIn}
        />
      ) : null}
    </>
  );
}
