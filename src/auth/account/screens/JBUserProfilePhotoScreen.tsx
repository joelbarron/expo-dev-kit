import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { getLastCreatedJBExpoConfig } from '../../../config';
import { JBFormButton } from '../../../forms';
import { useAppConfigStore, useAuthStore } from '../../../runtime';
import { Box, Text, VStack } from '../../../ui';
import { parseAuthError } from '../../forms/errorParser';
import { useJBAuth } from '../../provider';
import { getProfileFullName } from '../../utils';
import { AuthScreenLayout } from '../../ui';
import { JBUserPhotoPickerCard } from '../components';

type SelectedPhoto = {
  uri: string;
  base64: string;
  mimeType?: string;
};

type FormValues = {
  pictureBase64: string;
};

const schema = z.object({
  pictureBase64: z.string().min(1, 'Debes seleccionar una imagen'),
});

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
  return message.includes('base64') || message.includes('image') || message.includes('imagen') || message.includes('format');
};

export function JBUserProfilePhotoScreen() {
  const auth = useJBAuth();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const baseConfig = getLastCreatedJBExpoConfig();
  const cropConfig = appConfig?.auth?.userSettings?.screens?.photo?.crop ?? baseConfig.auth.userSettings.screens.photo.crop;
  const activeProfile = useAuthStore((state: any) => state?.activeProfile);
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhoto | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { control, formState, setValue, clearErrors, reset } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { pictureBase64: '' },
    resolver: zodResolver(schema),
  });

  const profilePicture = useMemo(() => {
    const profile = activeProfile as any;
    return (
      (typeof profile?.picture === 'string' && profile.picture) ||
      (typeof profile?.avatar === 'string' && profile.avatar) ||
      (typeof profile?.image === 'string' && profile.image) ||
      ''
    );
  }, [activeProfile]);

  const displayName = useMemo(
    () => getProfileFullName(activeProfile as any) || String((activeProfile as any)?.username ?? 'Perfil'),
    [activeProfile]
  );

  const applySelectedAsset = useCallback(
    (asset: ImagePicker.ImagePickerAsset | undefined) => {
      if (!asset || !asset.base64) {
        Toast.show({ type: 'error', text1: 'Imagen inválida', text2: 'No se pudo leer la imagen seleccionada.' });
        return;
      }
      const nextPhoto: SelectedPhoto = {
        uri: asset.uri,
        base64: asset.base64,
        mimeType: inferMimeType(asset),
      };
      setSelectedPhoto(nextPhoto);
      setValue('pictureBase64', nextPhoto.base64, { shouldValidate: true });
      clearErrors('pictureBase64');
    },
    [clearErrors, setValue]
  );

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Permiso requerido', text2: 'Autoriza acceso a tus fotos para continuar.' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
      allowsEditing: cropConfig.enabled ? cropConfig.allowsEditing : false,
      aspect: cropConfig.enabled ? cropConfig.aspect : [1, 1],
      selectionLimit: 1,
    });

    if (result.canceled) return;
    applySelectedAsset(result.assets?.[0]);
  }, [applySelectedAsset, cropConfig]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Permiso requerido', text2: 'Autoriza acceso a la cámara para continuar.' });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
      allowsEditing: cropConfig.enabled ? cropConfig.allowsEditing : false,
      aspect: cropConfig.enabled ? cropConfig.aspect : [1, 1],
    });

    if (result.canceled) return;
    applySelectedAsset(result.assets?.[0]);
  }, [applySelectedAsset, cropConfig]);

  const submitSave = useCallback(async () => {
    const pictureBase64 = selectedPhoto?.base64;
    if (!pictureBase64) {
      Toast.show({ type: 'error', text1: 'Falta imagen', text2: 'Selecciona una imagen antes de guardar.' });
      return;
    }

    setIsSaving(true);
    try {
      await auth.updateProfilePicture({ picture: pictureBase64 });
    } catch (error) {
      if (selectedPhoto?.mimeType && !pictureBase64.startsWith('data:') && shouldRetryAsDataUri(error)) {
        const dataUri = `data:${selectedPhoto.mimeType};base64,${pictureBase64}`;
        await auth.updateProfilePicture({ picture: dataUri });
      } else {
        throw error;
      }
    }

    try {
      await auth.getMe();
    } catch {
      // best-effort refresh
    }

    Toast.show({ type: 'success', text1: 'Foto actualizada', text2: 'Tu foto de perfil se actualizó correctamente.' });
    setSelectedPhoto(null);
    reset({ pictureBase64: '' });
    setIsSaving(false);
  }, [auth, reset, selectedPhoto]);

  const handleSave = useCallback(async () => {
    try {
      await submitSave();
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({ type: 'error', text1: 'Error al guardar foto', text2: parsed.rootMessage || 'No se pudo actualizar la foto.' });
      setIsSaving(false);
    }
  }, [submitSave]);

  const canSave = Boolean(selectedPhoto?.base64) && !isSaving && formState.isValid;

  return (
    <AuthScreenLayout
      footerAdjustableHeight
      footerClassName="pt-4 pb-6"
      footer={
        <VStack space="sm" className="pt-4">
          <JBFormButton
            buttonType="save"
            text="Guardar foto"
            loading={isSaving}
            isDisabled={!canSave}
            onPress={handleSave}
          />
          <JBFormButton
            variant="link"
            action="primary"
            text="Actualizar datos del perfil"
            className="self-center px-0"
            onPress={() => {
              void auth.getMe().catch(() => undefined);
            }}
          />
        </VStack>
      }
    >
      <Box className="w-full">
        <VStack space="lg">
          <Text size="sm" className="text-typography-300">
            Selecciona una foto y recórtala en formato 1:1 para tu perfil activo.
          </Text>
          <JBUserPhotoPickerCard
            currentPhotoUri={profilePicture}
            previewUri={selectedPhoto?.uri ?? null}
            displayName={displayName}
            onPickFromLibrary={() => void pickFromLibrary()}
            onTakePhoto={() => void takePhoto()}
            onClearPreview={() => {
              setSelectedPhoto(null);
              reset({ pictureBase64: '' });
            }}
            isBusy={isSaving}
          />
        </VStack>
      </Box>
    </AuthScreenLayout>
  );
}
