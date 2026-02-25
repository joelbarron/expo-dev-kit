import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { JBFormButton, JBFormCheckbox, JBFormInput } from '../../../forms';
import { Box, Text, VStack } from '../../../ui';
import { parseAuthError } from '../../forms/errorParser';
import { useJBAuth } from '../../provider';
import { AuthScreenLayout } from '../../ui';

const schema = z.object({
  email: z.union([z.string().trim().email('Correo inválido'), z.literal('')]).optional(),
  username: z.string().optional(),
  phone: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  termsAndConditions: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const pickString = (value: unknown): string => (typeof value === 'string' ? value : '');
const pickBoolean = (value: unknown): boolean | undefined => (typeof value === 'boolean' ? value : undefined);

export function JBUserPersonalDataScreen() {
  const auth = useJBAuth();
  const user = (auth.user ?? {}) as Record<string, any>;
  const hasTermsField =
    Object.prototype.hasOwnProperty.call(user, 'termsAndConditions') ||
    Object.prototype.hasOwnProperty.call(user, 'terms_and_conditions');

  const initialValues = useMemo<FormValues>(() => ({
    email: pickString(user.email),
    username: pickString(user.username),
    phone: pickString(user.phone),
    language: pickString(user.language),
    timezone: pickString(user.timezone),
    termsAndConditions:
      pickBoolean(user.termsAndConditions) ?? pickBoolean(user.terms_and_conditions) ?? false,
  }), [user]);

  const { control, formState, handleSubmit, setError, clearErrors, watch, reset } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: initialValues,
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    const sub = watch((_v, meta) => {
      if (meta.name) clearErrors(meta.name as any);
      clearErrors('root');
    });
    return () => sub.unsubscribe();
  }, [watch, clearErrors]);

  const submitForm = useCallback(async (values: FormValues) => {
    const payload: Record<string, unknown> = {};
    const phone = values.phone?.trim();

    payload.phone = phone ? phone : null;
    // Campo email deshabilitado por decisión de producto (no editable por ahora).
    // if (email !== undefined) payload.email = email || undefined;
    // Campo username deshabilitado por ahora.
    // payload.username = username ? username : null;
    // Campo language deshabilitado por ahora.
    // if (language) payload.language = language;
    // Campo timezone deshabilitado por ahora.
    // if (timezone) payload.timezone = timezone;
    // Campo termsAndConditions deshabilitado por ahora.
    // if (hasTermsField && typeof values.termsAndConditions === 'boolean') {
    //   payload.termsAndConditions = values.termsAndConditions;
    // }

    try {
      await auth.updateAccount(payload as any, 'PATCH');
      try {
        await auth.getMe();
      } catch {
        // best-effort sync
      }
      Toast.show({ type: 'success', text1: 'Datos actualizados', text2: 'Se guardaron los cambios de tu cuenta.' });
    } catch (error) {
      const parsed = parseAuthError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
        setError(field as any, { type: 'manual', message });
      });
      Toast.show({ type: 'error', text1: 'Error al actualizar datos', text2: parsed.rootMessage || 'No se pudieron guardar los cambios.' });
    }
  }, [auth, hasTermsField, setError]);

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
          <Text size="sm" className="text-typography-300">
            Actualiza la información básica de tu cuenta. Los cambios se envían al endpoint de account update.
          </Text>

          {/* Correo no editable por ahora.
          <JBFormInput control={control} fieldName="email" label="Correo" keyboardType="email-address" autoCapitalize="none" isDisabled={isLoading} />
          */}
          {/* Username no editable por ahora.
          <JBFormInput control={control} fieldName="username" label="Usuario" autoCapitalize="none" isDisabled={isLoading} />
          */}
          <JBFormInput control={control} fieldName="phone" label="Teléfono" keyboardType="phone-pad" isDisabled={isLoading} />
          {/* Idioma no editable por ahora.
          <JBFormInput control={control} fieldName="language" label="Idioma" autoCapitalize="none" isDisabled={isLoading} />
          */}
          {/* Zona horaria no editable por ahora.
          <JBFormInput control={control} fieldName="timezone" label="Zona horaria" autoCapitalize="none" isDisabled={isLoading} />
          */}

          {/* Términos y condiciones no editable por ahora.
          {hasTermsField ? (
            <JBFormCheckbox
              control={control}
              fieldName="termsAndConditions"
              label="Términos y condiciones aceptados"
              isDisabled={isLoading}
            />
          ) : null}
          */}
        </VStack>
      </Box>
    </AuthScreenLayout>
  );
}
