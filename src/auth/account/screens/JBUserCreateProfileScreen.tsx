import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { JBFormButton, JBFormDateTimePicker, JBFormInput, JBFormPicker } from '../../../forms';
import { Box, VStack } from '../../../ui';
import { parseAuthError } from '../../forms/errorParser';
import { useJBAuth } from '../../provider';
import { AuthScreenLayout } from '../../ui';
import { useJBUserAccountCapabilities } from '../hooks';
import { GENDERS, GENDER_SELECT_OPTIONS } from '../../constants';
import { getFormattedDate } from '../../../utils/data-format';

const createSchema = (requireRole: boolean) =>
  z.object({
    firstName: z.string().trim().min(1, 'Debes ingresar el nombre'),
    lastName1: z.string().trim().min(1, 'Debes ingresar el primer apellido'),
    lastName2: z.string().optional(),
    birthday: z.date().optional(),
    gender: z.any().optional(),
    role: z.any().optional(),
    isDefault: z.boolean().optional(),
  }).superRefine((data, ctx) => {
    const roleValue = typeof data.role === 'string' ? data.role : data.role?.value;
    if (requireRole && !roleValue) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes seleccionar un rol', path: ['role'] });
    }
    if (!data.birthday) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes seleccionar la fecha de nacimiento', path: ['birthday'] });
    }
    const genderValue = typeof data.gender === 'string' ? data.gender : data.gender?.value;
    if (genderValue && !GENDERS.includes(genderValue)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Género inválido.', path: ['gender'] });
    }
  });

type FormValues = {
  firstName: string;
  lastName1: string;
  lastName2?: string;
  birthday?: Date;
  gender?: any;
  role?: any;
  isDefault?: boolean;
};

export function JBUserCreateProfileScreen() {
  const router = useRouter();
  const auth = useJBAuth();
  const capabilities = useJBUserAccountCapabilities();
  const { roleOptions } = capabilities;
  const isProfileMirrorEnabled = Boolean(capabilities.accountConfig.profileMirror?.enabled);

  const pickerRoleOptions = useMemo(
    () =>
      roleOptions
        .filter((role) => role.allowSignup === true || (role as any).allowSignUp === true)
        .map((role) => ({ value: role.value, label: role.label })),
    [roleOptions]
  );
  const requiresRole = pickerRoleOptions.length > 1;
  const schema = useMemo(() => createSchema(requiresRole), [requiresRole]);
  const defaultRole = pickerRoleOptions.length === 1 ? pickerRoleOptions[0] : undefined;

  const { control, formState, handleSubmit, setError, clearErrors, watch } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName1: '',
      lastName2: '',
      birthday: undefined,
      gender: undefined,
      role: defaultRole,
      isDefault: false,
    },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const sub = watch((_v, meta) => {
      if (meta.name) {
        clearErrors(meta.name as any);
      }
      clearErrors('root');
    });
    return () => sub.unsubscribe();
  }, [watch, clearErrors]);

  const submitForm = useCallback(async (values: FormValues) => {
    if (isProfileMirrorEnabled) {
      Toast.show({
        type: 'info',
        text1: 'No disponible',
        text2: 'La creación manual de perfiles está deshabilitada por sincronización de perfiles.',
      });
      return;
    }
    const roleValue = typeof values.role === 'string' ? values.role : values.role?.value;
    const genderValue = typeof values.gender === 'string' ? values.gender : values.gender?.value;
    try {
      await auth.createProfile({
        firstName: values.firstName.trim(),
        lastName1: values.lastName1.trim(),
        lastName2: values.lastName2?.trim() || undefined,
        birthday: values.birthday ? getFormattedDate(values.birthday) : undefined,
        gender: genderValue || undefined,
        role: roleValue || undefined,
      });
      await auth.getProfiles();
      Toast.show({
        type: 'success',
        text1: 'Perfil creado',
        text2: 'El perfil se creó correctamente.',
      });
      router.replace('/user/profiles' as any);
    } catch (error) {
      const parsed = parseAuthError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
        setError(field as any, { type: 'manual', message });
      });
      Toast.show({
        type: 'error',
        text1: 'Error al crear perfil',
        text2: parsed.rootMessage || 'No se pudo crear el perfil.',
      });
    }
  }, [auth, isProfileMirrorEnabled, router, setError]);

  const isLoading = formState.isSubmitting;

  if (isProfileMirrorEnabled) {
    return (
      <AuthScreenLayout
        subtitle="La sincronización de perfiles está activa y la creación manual de perfiles adicionales no está disponible."
      >
        <Box className="w-full">
          <VStack space="lg">
            <JBFormButton
              variant="solid"
              action="primary"
              text="Volver"
              showIcon={false}
              onPress={() => router.replace('/user/profiles' as any)}
            />
          </VStack>
        </Box>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      footerAdjustableHeight
      footerClassName="pt-4 pb-6"
      footer={
        <VStack space="sm" className="pt-4">
          <JBFormButton
            buttonType="add"
            text="Crear perfil"
            loading={isLoading}
            isDisabled={!formState.isValid}
            onPress={() => void handleSubmit(submitForm)()}
          />
          <JBFormButton
            variant="link"
            action="primary"
            text="Cancelar"
            className="self-center px-0"
            onPress={() => router.back()}
          />
        </VStack>
      }
    >
      <Box className="w-full">
        <VStack space="lg">
          <JBFormInput control={control} fieldName="firstName" label="Nombre(s)" isDisabled={isLoading} />
          <JBFormInput control={control} fieldName="lastName1" label="Primer apellido" isDisabled={isLoading} />
          <JBFormInput control={control} fieldName="lastName2" label="Segundo apellido" isDisabled={isLoading} />
          <JBFormDateTimePicker
            control={control}
            fieldName="birthday"
            label="Fecha de nacimiento"
            mode="date"
            isDisabled={isLoading}
          />
          <JBFormPicker
            control={control}
            fieldName="gender"
            label="Género"
            items={GENDER_SELECT_OPTIONS}
            isDisabled={isLoading}
          />

          {pickerRoleOptions.length > 0 ? (
            <JBFormPicker
              control={control}
              fieldName="role"
              label="Rol"
              items={pickerRoleOptions}
              isDisabled={isLoading}
            />
          ) : null}

          {/* No permitir seleccionar perfil por defecto al crear perfiles desde mobile por ahora.
          <JBFormCheckbox
            control={control}
            fieldName="isDefault"
            label="Usar como perfil por defecto"
            isDisabled={isLoading}
          />
          */}
        </VStack>
      </Box>
    </AuthScreenLayout>
  );
}
