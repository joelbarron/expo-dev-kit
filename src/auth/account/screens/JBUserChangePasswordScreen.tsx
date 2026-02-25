import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { JBFormButton, JBFormPasswordInput } from '../../../forms';
import { Box, VStack } from '../../../ui';
import { parseAuthError } from '../../forms/errorParser';
import { getDjangoLikePasswordError } from '../../forms/password/passwordValidation';
import { useJBAuth } from '../../provider';
import { AuthScreenLayout } from '../../ui';

type FormValues = {
  oldPassword: string;
  password: string;
  passwordConfirm: string;
};

const schema = z.object({
  oldPassword: z.string().min(1, 'Debes ingresar la contraseña actual'),
  password: z.string().min(1, 'Debes ingresar la nueva contraseña'),
  passwordConfirm: z.string().min(1, 'Debes confirmar la nueva contraseña'),
}).superRefine((data, ctx) => {
  const passwordError = getDjangoLikePasswordError(data.password);
  if (passwordError) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: passwordError, path: ['password'] });
  }
  if (data.password !== data.passwordConfirm) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Las contraseñas deben coincidir', path: ['passwordConfirm'] });
  }
});

export function JBUserChangePasswordScreen() {
  const router = useRouter();
  const auth = useJBAuth();
  const { control, formState, handleSubmit, setError, clearErrors, watch } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { oldPassword: '', password: '', passwordConfirm: '' },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const sub = watch((_v, meta) => {
      if (meta.name) clearErrors(meta.name as any);
      clearErrors('root');
    });
    return () => sub.unsubscribe();
  }, [watch, clearErrors]);

  const submitForm = useCallback(async (values: FormValues) => {
    try {
      await auth.changePassword({ oldPassword: values.oldPassword, password: values.password });
      Toast.show({ type: 'success', text1: 'Contraseña actualizada', text2: 'Tu contraseña se cambió correctamente.' });
      router.back();
    } catch (error) {
      const parsed = parseAuthError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
        setError(field as any, { type: 'manual', message });
      });
      Toast.show({
        type: 'error',
        text1: 'Error al cambiar contraseña',
        text2: parsed.rootMessage || 'No se pudo actualizar la contraseña.',
      });
    }
  }, [auth, router, setError]);

  const isLoading = formState.isSubmitting;

  return (
    <AuthScreenLayout
      footerAdjustableHeight
      footerClassName="pt-4 pb-6"
      footer={
        <JBFormButton
          buttonType="save"
          text="Guardar cambios"
          loading={isLoading}
          isDisabled={!formState.isValid}
          onPress={() => void handleSubmit(submitForm)()}
        />
      }
    >
      <Box className="w-full">
        <VStack space="lg">
          <JBFormPasswordInput control={control} fieldName="oldPassword" label="Contraseña actual" isDisabled={isLoading} />
          <JBFormPasswordInput control={control} fieldName="password" label="Nueva contraseña" isDisabled={isLoading} />
          <JBFormPasswordInput control={control} fieldName="passwordConfirm" label="Confirmar nueva contraseña" isDisabled={isLoading} />
        </VStack>
      </Box>
    </AuthScreenLayout>
  );
}
