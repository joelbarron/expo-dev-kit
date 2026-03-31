import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import {
  getLastCreatedJBExpoConfig,
  getSettingsConfig,
  getSettingsRoutesConfig,
} from '../../../config';
import { JBFormButton, JBFormDateTimePicker, JBFormInput, JBFormPicker } from '../../../forms';
import { useAppConfigStore } from '../../../runtime';
import { Box, HStack, Text, VStack } from '../../../ui';
import { getFormattedDate } from '../../../utils/data-format';
import { GENDERS, GENDER_SELECT_OPTIONS } from '../../constants';
import { parseAuthError } from '../../forms/errorParser';
import { useJBAuth } from '../../provider';
import { getProfileFullName, getProfilePictureUri } from '../../utils';
import { AuthScreenLayout } from '../../ui';
import { JBUserPhotoPickerCard } from '../components';
import { useJBUserAccountCapabilities } from '../hooks';

type SelectedPhoto = {
  uri: string;
  base64: string;
  mimeType?: string;
};

type FormValues = {
  firstName: string;
  lastName1: string;
  lastName2?: string;
  birthday?: Date;
  gender?: any;
  role?: any;
};

type ProfileRecord = Record<string, any>;

export type JBUserEditProfileScreenProps = {
  profileId: number | string;
};

const inferMimeType = (asset: ImagePicker.ImagePickerAsset): string => {
  if (asset.mimeType) return asset.mimeType;
  const normalized = asset.uri.toLowerCase();
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const shouldRetryAsDataUri = (error: unknown): boolean => {
  const parsed = parseAuthError(error);
  const message = (parsed.rootMessage || '').toLowerCase();
  return (
    message.includes('base64') ||
    message.includes('image') ||
    message.includes('imagen') ||
    message.includes('format')
  );
};

const toStringValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const toDateValue = (value: unknown): Date | undefined => {
  if (value == null) return undefined;
  const raw = toStringValue(value);
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const normalizeProfileToFormValues = (profile: ProfileRecord): FormValues => {
  const genderValue = toStringValue(profile?.gender).toUpperCase();
  const genderOption = GENDER_SELECT_OPTIONS.find((option) => option.value === genderValue);
  const roleValue = toStringValue(profile?.role ?? profile?.role_value).toUpperCase();

  return {
    firstName: toStringValue(profile?.first_name ?? profile?.firstName),
    lastName1: toStringValue(profile?.last_name_1 ?? profile?.lastName1),
    lastName2: toStringValue(profile?.last_name_2 ?? profile?.lastName2),
    birthday: toDateValue(profile?.birthday),
    gender: genderOption ?? (genderValue ? { label: genderValue, value: genderValue } : undefined),
    role: roleValue ? { label: roleValue, value: roleValue } : undefined,
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
      role: z.any().optional(),
    })
    .superRefine((data, ctx) => {
      if (requiredFields.firstName && !data.firstName.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes ingresar el nombre.', path: ['firstName'] });
      }
      if (requiredFields.lastName1 && !data.lastName1.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes ingresar el primer apellido.', path: ['lastName1'] });
      }
      if (requiredFields.lastName2 && !String(data.lastName2 ?? '').trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes ingresar el segundo apellido.', path: ['lastName2'] });
      }
      if (requiredFields.birthday && !data.birthday) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes seleccionar la fecha de nacimiento.', path: ['birthday'] });
      }
      const genderValue = typeof data.gender === 'string' ? data.gender : data.gender?.value;
      if (requiredFields.gender && !genderValue) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes seleccionar el género.', path: ['gender'] });
      }
      if (
        genderValue &&
        !GENDERS.includes(String(genderValue).toUpperCase() as (typeof GENDERS)[number])
      ) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Género inválido.', path: ['gender'] });
      }
    });

const ProfileEditSkeleton = () => (
  <VStack space="lg">
    <Box className="rounded-3xl bg-background-150 dark:bg-background-200 p-5">
      <HStack className="items-center" space="md">
        <Box className="h-20 w-20 rounded-full bg-background-300 dark:bg-background-400" />
        <VStack className="flex-1" space="sm">
          <Box className="h-5 w-2/3 rounded-full bg-background-300 dark:bg-background-400" />
          <Box className="h-4 w-1/2 rounded-full bg-background-300 dark:bg-background-400" />
        </VStack>
      </HStack>
      <VStack className="pt-5" space="sm">
        <Box className="h-11 rounded-xl bg-background-300 dark:bg-background-400" />
        <Box className="h-11 rounded-xl bg-background-300 dark:bg-background-400" />
      </VStack>
    </Box>

    <VStack space="md">
      {[0, 1, 2, 3, 4].map((index) => (
        <Box
          key={`profile-edit-skeleton-field-${index}`}
          className="h-14 rounded-2xl bg-background-200 dark:bg-background-300"
        />
      ))}
    </VStack>
  </VStack>
);

export function JBUserEditProfileScreen({ profileId }: JBUserEditProfileScreenProps) {
  const router = useRouter();
  const auth = useJBAuth();
  const capabilities = useJBUserAccountCapabilities();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const baseConfig = getLastCreatedJBExpoConfig();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [loadedProfile, setLoadedProfile] = useState<ProfileRecord | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhoto | null>(null);
  const [photoCacheKey] = useState<number | null>(null);

  const mergedConfig = useMemo(
    () => ({
      ...baseConfig,
      settings: {
        ...(baseConfig.settings ?? {}),
        ...(appConfig?.settings ?? {}),
      },
    }),
    [appConfig?.settings, baseConfig]
  );
  const settingsConfig = useMemo(
    () => getSettingsConfig(mergedConfig as any),
    [mergedConfig]
  );
  const settingsRoutes = useMemo(
    () => getSettingsRoutesConfig(mergedConfig as any),
    [mergedConfig]
  );
  const permissionsSettingsPath = useMemo(() => {
    const configuredPath = settingsConfig.permissions?.path?.trim();
    if (!configuredPath) return settingsRoutes.permissions;
    return configuredPath.startsWith('/') ? configuredPath : `/${configuredPath}`;
  }, [settingsConfig.permissions?.path, settingsRoutes.permissions]);

  const requiredFields = capabilities.accountConfig.requiredProfileFields as Record<string, boolean>;
  const schema = useMemo(() => createSchema(requiredFields), [requiredFields]);
  const normalizedProfileId = useMemo(() => Number(profileId), [profileId]);
  const pickerRoleOptions = useMemo(
    () =>
      capabilities.roleOptions
        .filter((role) => role.allowSignup === true || (role as any).allowSignUp === true)
        .map((role) => ({ value: role.value, label: role.label })),
    [capabilities.roleOptions]
  );

  const { control, formState, handleSubmit, reset, setError, clearErrors, watch } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName1: '',
      lastName2: '',
      birthday: undefined,
      gender: undefined,
      role: undefined,
    },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const subscription = watch((_values, meta) => {
      if (meta.name) {
        clearErrors(meta.name as any);
      }
      clearErrors('root');
    });
    return () => subscription.unsubscribe();
  }, [clearErrors, watch]);

  const loadProfile = useCallback(async () => {
    if (!Number.isFinite(normalizedProfileId) || normalizedProfileId <= 0) {
      setIsLoadingProfile(false);
      Toast.show({
        type: 'error',
        text1: 'Perfil inválido',
        text2: 'No se pudo identificar el perfil a editar.',
      });
      return;
    }

    setIsLoadingProfile(true);
    try {
      const response = await auth.getProfileById(normalizedProfileId);
      const profile = (response ?? {}) as ProfileRecord;
      setLoadedProfile(profile);
      reset(normalizeProfileToFormValues(profile));
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'Error al cargar perfil',
        text2: parsed.rootMessage || 'No se pudo cargar el perfil.',
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }, [auth, normalizedProfileId, reset]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const currentPhotoUri = useMemo(
    () => getProfilePictureUri(loadedProfile as any, { cacheKey: photoCacheKey }),
    [loadedProfile, photoCacheKey]
  );
  const displayName = useMemo(
    () => getProfileFullName(loadedProfile as any) || toStringValue(loadedProfile?.username) || 'Perfil',
    [loadedProfile]
  );

  const applySelectedAsset = useCallback((asset: ImagePicker.ImagePickerAsset | undefined) => {
    if (!asset || !asset.base64) {
      Toast.show({
        type: 'error',
        text1: 'Imagen inválida',
        text2: 'No se pudo leer la imagen seleccionada.',
      });
      return;
    }
    setSelectedPhoto({
      uri: asset.uri,
      base64: asset.base64,
      mimeType: inferMimeType(asset),
    });
  }, []);

  const openPermissionsSetup = useCallback(() => {
    router.push(permissionsSettingsPath as any);
  }, [permissionsSettingsPath, router]);

  const handlePermissionDenied = useCallback(
    (resource: string, canAskAgain?: boolean | null) => {
      if (canAskAgain === false) {
        Toast.show({
          type: 'error',
          text1: 'Permiso bloqueado',
          text2: `Activa ${resource} en permisos para continuar.`,
        });
        openPermissionsSetup();
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'Permiso requerido',
        text2: `Autoriza ${resource} para continuar.`,
      });
    },
    [openPermissionsSetup]
  );

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      handlePermissionDenied('el acceso a tus fotos', permission.canAskAgain);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      selectionLimit: 1,
    });
    if (result.canceled) return;
    applySelectedAsset(result.assets?.[0]);
  }, [applySelectedAsset, handlePermissionDenied]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      handlePermissionDenied('el acceso a la camara', permission.canAskAgain);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    applySelectedAsset(result.assets?.[0]);
  }, [applySelectedAsset, handlePermissionDenied]);

  const submitForm = useCallback(
    async (values: FormValues) => {
      if (!Number.isFinite(normalizedProfileId) || normalizedProfileId <= 0) {
        Toast.show({
          type: 'error',
          text1: 'Perfil inválido',
          text2: 'No se pudo identificar el perfil a editar.',
        });
        return;
      }

      const roleValue = typeof values.role === 'string' ? values.role : values.role?.value;
      const genderValue = typeof values.gender === 'string' ? values.gender : values.gender?.value;
      try {
        await auth.updateProfile(normalizedProfileId, {
          first_name: values.firstName.trim(),
          last_name_1: values.lastName1.trim(),
          last_name_2: values.lastName2?.trim() || '',
          birthday: values.birthday ? getFormattedDate(values.birthday) : null,
          gender: genderValue ? String(genderValue).toUpperCase() : null,
          role: roleValue ? String(roleValue).toUpperCase() : undefined,
        });

        if (selectedPhoto?.base64) {
          try {
            await auth.updateProfilePicture({
              profile: normalizedProfileId,
              picture: selectedPhoto.base64,
            });
          } catch (error) {
            if (
              selectedPhoto?.mimeType &&
              !selectedPhoto.base64.startsWith('data:') &&
              shouldRetryAsDataUri(error)
            ) {
              await auth.updateProfilePicture({
                profile: normalizedProfileId,
                picture: `data:${selectedPhoto.mimeType};base64,${selectedPhoto.base64}`,
              });
            } else {
              throw error;
            }
          }
        }

        await Promise.all([
          auth.getMe().catch(() => undefined),
          auth.getProfiles().catch(() => undefined),
        ]);

        Toast.show({
          type: 'success',
          text1: 'Perfil actualizado',
          text2: 'Se guardaron los cambios del perfil adicional.',
        });
        router.back();
      } catch (error) {
        const parsed = parseAuthError(error);
        const fieldMap: Record<string, keyof FormValues> = {
          first_name: 'firstName',
          firstName: 'firstName',
          last_name_1: 'lastName1',
          lastName1: 'lastName1',
          last_name_2: 'lastName2',
          lastName2: 'lastName2',
          birthday: 'birthday',
          gender: 'gender',
          role: 'role',
        };
        Object.entries(parsed.fieldErrors).forEach(([fieldName, message]) => {
          const targetField = fieldMap[fieldName];
          if (!targetField) return;
          setError(targetField, { type: 'manual', message: String(message) });
        });

        Toast.show({
          type: 'error',
          text1: 'Error al actualizar perfil',
          text2: parsed.rootMessage || 'No se pudieron guardar los cambios.',
        });
      }
    },
    [auth, normalizedProfileId, router, selectedPhoto, setError]
  );

  const isSubmitting = formState.isSubmitting;
  const canSubmit =
    !isLoadingProfile &&
    !isSubmitting &&
    (formState.isDirty || Boolean(selectedPhoto?.base64)) &&
    formState.isValid;

  const showRolePicker = pickerRoleOptions.length > 0;
  const selectedRoleValue =
    typeof loadedProfile?.role === 'string' ? loadedProfile.role.toUpperCase() : '';
  const resolvedRoleOptions = useMemo(() => {
    if (!selectedRoleValue) {
      return pickerRoleOptions;
    }
    const hasCurrentRole = pickerRoleOptions.some(
      (option) => String(option.value).toUpperCase() === selectedRoleValue
    );
    if (hasCurrentRole) {
      return pickerRoleOptions;
    }
    return [
      ...pickerRoleOptions,
      { value: selectedRoleValue, label: selectedRoleValue },
    ];
  }, [pickerRoleOptions, selectedRoleValue]);

  return (
    <AuthScreenLayout
      subtitle="Actualiza los datos del perfil adicional y su foto."
      footerClassName="pt-4 pb-6"
      footer={
        <JBFormButton
          buttonType="save"
          text="Guardar cambios"
          showIcon={false}
          loading={isSubmitting}
          isDisabled={!canSubmit}
          onPress={() => void handleSubmit(submitForm)()}
        />
      }
    >
      <Box className="w-full">
        {isLoadingProfile ? (
          <ProfileEditSkeleton />
        ) : (
          <VStack space="lg">
            <JBUserPhotoPickerCard
              currentPhotoUri={currentPhotoUri}
              previewUri={selectedPhoto?.uri ?? null}
              displayName={displayName}
              onPickFromLibrary={() => void pickFromLibrary()}
              onTakePhoto={() => void takePhoto()}
              onClearPreview={() => setSelectedPhoto(null)}
              isBusy={isSubmitting}
              cacheKey={photoCacheKey}
            />

            <JBFormInput
              control={control}
              fieldName="firstName"
              label="Nombre(s)"
              isDisabled={isSubmitting}
            />
            <JBFormInput
              control={control}
              fieldName="lastName1"
              label="Primer apellido"
              isDisabled={isSubmitting}
            />
            <JBFormInput
              control={control}
              fieldName="lastName2"
              label="Segundo apellido"
              isDisabled={isSubmitting}
            />
            <JBFormDateTimePicker
              control={control}
              fieldName="birthday"
              label="Fecha de nacimiento"
              mode="date"
              isDisabled={isSubmitting}
            />
            <JBFormPicker
              control={control}
              fieldName="gender"
              label="Género"
              items={GENDER_SELECT_OPTIONS}
              isDisabled={isSubmitting}
            />
            {showRolePicker ? (
              <JBFormPicker
                control={control}
                fieldName="role"
                label="Rol"
                items={resolvedRoleOptions}
                isDisabled={isSubmitting}
              />
            ) : null}
          </VStack>
        )}
      </Box>
    </AuthScreenLayout>
  );
}
