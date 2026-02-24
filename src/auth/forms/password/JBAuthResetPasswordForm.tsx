import { useForm } from 'react-hook-form';

import { JBFormButton, JBFormPasswordInput } from '../../../forms';

export type JBAuthResetPasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export type JBAuthResetPasswordFormProps = {
  defaultValues?: Partial<JBAuthResetPasswordFormValues>;
  loading?: boolean;
  submitLabel?: string;
  onSubmit: (values: JBAuthResetPasswordFormValues) => void | Promise<void>;
};

export function JBAuthResetPasswordForm(props: JBAuthResetPasswordFormProps) {
  const { defaultValues, loading = false, submitLabel = 'Restablecer contraseña', onSubmit } = props;

  const { control, handleSubmit, watch } = useForm<JBAuthResetPasswordFormValues>({
    defaultValues: {
      newPassword: defaultValues?.newPassword ?? '',
      confirmPassword: defaultValues?.confirmPassword ?? ''
    }
  });

  const newPassword = watch('newPassword');

  return (
    <>
      <JBFormPasswordInput
        control={control}
        fieldName="newPassword"
        label="Nueva contraseña"
        enforceDjangoLikeValidation
        rules={{
          required: 'El password es requerido'
        }}
      />
      <JBFormPasswordInput
        control={control}
        fieldName="confirmPassword"
        label="Confirmar contraseña"
        rules={{
          required: 'La confirmación es requerida',
          validate: (value: string) => value === newPassword || 'Las contraseñas no coinciden'
        }}
      />

      <JBFormButton text={submitLabel} loading={loading} onPress={handleSubmit(onSubmit)} />
    </>
  );
}
