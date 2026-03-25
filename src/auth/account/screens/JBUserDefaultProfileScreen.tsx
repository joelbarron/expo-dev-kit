import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { JBFormButton, JBFormDateTimePicker, JBFormInput, JBFormPicker } from '../../../forms';
import { useAuthStore } from '../../../runtime';
import { Box, Text, VStack } from '../../../ui';
import { getFormattedDate } from '../../../utils/data-format';
import { GENDERS, GENDER_SELECT_OPTIONS } from '../../constants';
import { parseAuthError } from '../../forms/errorParser';
import { useJBAuth } from '../../provider';
import { AuthScreenLayout } from '../../ui';
import { useJBUserAccountCapabilities } from '../hooks';

type FormValues = {
  firstName: string;
  lastName1: string;
  lastName2?: string;
  birthday?: Date;
  gender?: any;
  label?: string;
};

type ProfileDetail = Record<string, any>;

const toStringValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const getProfileId = (profile: ProfileDetail | null | undefined): number | null => {
  if (!profile) return null;
  const rawId = Number(profile.id ?? profile.pk ?? 0);
  if (!Number.isFinite(rawId) || rawId <= 0) return null;
  return rawId;
};

const isDefaultProfile = (profile: ProfileDetail | null | undefined): boolean =>
  Boolean(profile?.default ?? profile?.is_default ?? profile?.isDefault);

const toDateValue = (value: unknown): Date | undefined => {
  if (value == null) return undefined;
  const strValue = toStringValue(value);
  if (!strValue) return undefined;
  const parsedDate = new Date(strValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }
  return parsedDate;
};

const normalizeProfiles = (payload: unknown): ProfileDetail[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item) => item && typeof item === 'object') as ProfileDetail[];
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.results)) {
      return record.results.filter((item) => item && typeof item === 'object') as ProfileDetail[];
    }
  }
  return [];
};

const toFormValues = (profile: ProfileDetail): FormValues => {
  const genderValue = toStringValue(profile.gender).toUpperCase();
  const selectedGenderOption = GENDER_SELECT_OPTIONS.find((option) => option.value === genderValue);

  return {
    firstName: toStringValue(profile.first_name ?? profile.firstName),
    lastName1: toStringValue(profile.last_name_1 ?? profile.lastName1),
    lastName2: toStringValue(profile.last_name_2 ?? profile.lastName2),
    birthday: toDateValue(profile.birthday),
    gender: selectedGenderOption ?? (genderValue ? { label: genderValue, value: genderValue } : undefined),
    label: toStringValue(profile.label),
  };
};

const createSchema = (requiredFields: Record<string, boolean>) =>
  z
    .object({
      firstName: z.string().trim(),
      lastName1: z.string().trim(),
      lastName2: z.string().optional(),
      birthday: z.date().optional(),
      gender: z.any().optional(),
      label: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (requiredFields.firstName && !data.firstName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes ingresar el nombre.',
          path: ['firstName'],
        });
      }
      if (requiredFields.lastName1 && !data.lastName1.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes ingresar el primer apellido.',
          path: ['lastName1'],
        });
      }
      if (requiredFields.lastName2 && !String(data.lastName2 ?? '').trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes ingresar el segundo apellido.',
          path: ['lastName2'],
        });
      }
      if (requiredFields.birthday && !data.birthday) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes seleccionar la fecha de nacimiento.',
          path: ['birthday'],
        });
      }

      const genderValue = typeof data.gender === 'string' ? data.gender : data.gender?.value;
      if (requiredFields.gender && !genderValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes seleccionar el género.',
          path: ['gender'],
        });
      }
      if (
        genderValue &&
        !GENDERS.includes(String(genderValue).toUpperCase() as (typeof GENDERS)[number])
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Género inválido.',
          path: ['gender'],
        });
      }

      if (requiredFields.label && !String(data.label ?? '').trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes ingresar la etiqueta del perfil.',
          path: ['label'],
        });
      }
    });

export function JBUserDefaultProfileScreen() {
  const auth = useJBAuth();
  const defaultProfile = useAuthStore((state: any) => state?.defaultProfile) as ProfileDetail | null;
  const activeProfile = useAuthStore((state: any) => state?.activeProfile) as ProfileDetail | null;
  const capabilities = useJBUserAccountCapabilities();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileId, setProfileId] = useState<number | null>(null);

  const requiredFields = capabilities.accountConfig.requiredProfileFields as Record<string, boolean>;
  const schema = useMemo(() => createSchema(requiredFields), [requiredFields]);

  const { control, formState, handleSubmit, reset } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName1: '',
      lastName2: '',
      birthday: undefined,
      gender: undefined,
      label: '',
    },
    resolver: zodResolver(schema),
  });

  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      let resolvedProfile: ProfileDetail | null = defaultProfile ?? activeProfile ?? null;
      const profilesResponse = await auth.getProfiles();
      const profiles = normalizeProfiles(profilesResponse);
      const defaultFromList = profiles.find((profile) => isDefaultProfile(profile)) ?? null;
      if (defaultFromList) {
        resolvedProfile = defaultFromList;
      }

      let resolvedProfileId = getProfileId(resolvedProfile);
      if (!resolvedProfileId && profiles.length > 0) {
        resolvedProfileId = getProfileId(profiles[0]);
        resolvedProfile = profiles[0];
      }

      if (!resolvedProfileId) {
        throw new Error('No se encontró un perfil principal para editar.');
      }

      let profileDetail: ProfileDetail = resolvedProfile ?? {};
      try {
        const detailResponse = await auth.getProfileById(resolvedProfileId);
        if (detailResponse && typeof detailResponse === 'object') {
          profileDetail = {
            ...profileDetail,
            ...(detailResponse as ProfileDetail),
          };
        }
      } catch {
        // Se conserva el perfil resuelto de la lista/store como fallback.
      }

      setProfileId(resolvedProfileId);
      reset(toFormValues(profileDetail));
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'No se pudo cargar el perfil',
        text2: parsed.rootMessage || 'Inténtalo de nuevo.',
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }, [activeProfile, auth, defaultProfile, reset]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const submitProfile = useCallback(
    async (values: FormValues) => {
      if (!capabilities.canEditDefaultProfile) {
        Toast.show({
          type: 'info',
          text1: 'Edición deshabilitada',
          text2: 'La edición del perfil principal no está habilitada.',
        });
        return;
      }

      if (!profileId) {
        Toast.show({
          type: 'error',
          text1: 'Perfil no disponible',
          text2: 'No se encontró un perfil para guardar cambios.',
        });
        return;
      }

      const genderValue = typeof values.gender === 'string' ? values.gender : values.gender?.value;
      const payload: Record<string, unknown> = {
        first_name: values.firstName.trim(),
        last_name_1: values.lastName1.trim(),
        last_name_2: String(values.lastName2 ?? '').trim() || '',
        birthday: values.birthday ? getFormattedDate(values.birthday) : null,
        gender: genderValue ? String(genderValue).toUpperCase() : null,
        label: String(values.label ?? '').trim() || '',
      };

      try {
        await auth.updateProfile(profileId, payload);
        await Promise.all([
          auth.getMe().catch(() => undefined),
          auth.getProfiles().catch(() => undefined),
        ]);
        await loadProfile();
        Toast.show({
          type: 'success',
          text1: 'Perfil actualizado',
          text2: 'Se guardaron los cambios del perfil principal.',
        });
      } catch (error) {
        const parsed = parseAuthError(error);
        Toast.show({
          type: 'error',
          text1: 'Error al guardar perfil',
          text2: parsed.rootMessage || 'No se pudieron guardar los cambios.',
        });
      }
    },
    [auth, capabilities.canEditDefaultProfile, loadProfile, profileId]
  );

  const isSubmitting = formState.isSubmitting;
  const canSubmit =
    capabilities.canEditDefaultProfile && !isLoadingProfile && !isSubmitting && formState.isValid;

  return (
    <AuthScreenLayout
      subtitle="Actualiza la información del perfil principal de tu cuenta."
      footerClassName="pt-4 pb-6"
      footer={
        <JBFormButton
          buttonType="save"
          text="Guardar cambios"
          showIcon={false}
          loading={isSubmitting}
          isDisabled={!canSubmit}
          onPress={() => void handleSubmit(submitProfile)()}
        />
      }
    >
      <Box className="w-full">
        {isLoadingProfile ? (
          <Text size="sm" className="text-typography-400">
            Cargando perfil principal...
          </Text>
        ) : (
          <VStack space="lg">
            {!capabilities.canEditDefaultProfile ? (
              <Text size="sm" className="text-typography-400">
                La edición del perfil principal está deshabilitada para esta aplicación.
              </Text>
            ) : null}

            <JBFormInput
              control={control}
              fieldName="firstName"
              label="Nombre(s)"
              isDisabled={!capabilities.canEditDefaultProfile || isSubmitting}
            />
            <JBFormInput
              control={control}
              fieldName="lastName1"
              label="Primer apellido"
              isDisabled={!capabilities.canEditDefaultProfile || isSubmitting}
            />
            <JBFormInput
              control={control}
              fieldName="lastName2"
              label="Segundo apellido"
              isDisabled={!capabilities.canEditDefaultProfile || isSubmitting}
            />
            <JBFormDateTimePicker
              control={control}
              fieldName="birthday"
              label="Fecha de nacimiento"
              mode="date"
              isDisabled={!capabilities.canEditDefaultProfile || isSubmitting}
            />
            <JBFormPicker
              control={control}
              fieldName="gender"
              label="Género"
              items={GENDER_SELECT_OPTIONS}
              isDisabled={!capabilities.canEditDefaultProfile || isSubmitting}
            />
            <JBFormInput
              control={control}
              fieldName="label"
              label="Etiqueta del perfil"
              placeholder="Ejemplo: Personal"
              isDisabled={!capabilities.canEditDefaultProfile || isSubmitting}
            />
          </VStack>
        )}
      </Box>
    </AuthScreenLayout>
  );
}
