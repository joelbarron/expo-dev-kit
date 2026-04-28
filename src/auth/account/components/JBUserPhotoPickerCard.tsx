import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';

import { JBFormButton } from '../../../forms';
import { useColorScheme } from '../../../hooks';
import { Avatar, AvatarFallbackText, AvatarImage, Card, HStack, Text, VStack } from '../../../ui';
import { getColor } from '../../../utils';
import { resolveProfilePictureUri } from '../../utils';

type JBUserPhotoPickerCardProps = {
  currentPhotoUri?: string | null;
  previewUri?: string | null;
  displayName?: string;
  onPickFromLibrary: () => void;
  onTakePhoto?: () => void;
  onClearPreview?: () => void;
  isBusy?: boolean;
  cacheKey?: string | number | null;
};

export const JBUserPhotoPickerCard = ({
  currentPhotoUri,
  previewUri,
  displayName = 'Perfil',
  onPickFromLibrary,
  onTakePhoto,
  onClearPreview,
  isBusy = false,
  cacheKey,
}: JBUserPhotoPickerCardProps) => {
  const scheme = useColorScheme();
  const typography = getColor('typography') ?? {};
  const imageUri = resolveProfilePictureUri(previewUri || currentPhotoUri || '', {
    cacheKey,
  }) || undefined;
  const [failedImageUri, setFailedImageUri] = useState<string | null>(null);
  const actionColor =
    scheme === 'dark'
      ? typography[50] ?? '#f8fafc'
      : typography.black ?? typography[900] ?? '#0f172a';

  useEffect(() => {
    if (!imageUri) {
      setFailedImageUri(null);
      return;
    }
    if (failedImageUri && failedImageUri !== imageUri) {
      setFailedImageUri(null);
    }
  }, [failedImageUri, imageUri]);

  const canRenderImage = Boolean(imageUri && failedImageUri !== imageUri);

  return (
    <Card className="w-full rounded-3xl border-0 bg-background-100 px-5 py-6 dark:bg-background-200">
      <VStack space="xl" className="items-center">
        <Avatar size="2xl" className="bg-primary-500">
          <AvatarFallbackText>{displayName}</AvatarFallbackText>
          {canRenderImage ? (
            <AvatarImage
              source={{ uri: imageUri as string }}
              onError={() => setFailedImageUri(imageUri as string)}
            />
          ) : null}
        </Avatar>

        <VStack className="w-full" space="sm">
          <JBFormButton
            variant="outline"
            action="primary"
            iconName="image-multiple-outline"
            iconPosition="start"
            text="Seleccionar de galería"
            iconColor={actionColor}
            textClassName="text-[15px] font-bold text-typography-900"
            loading={false}
            isDisabled={isBusy}
            onPress={onPickFromLibrary}
          />
          {onTakePhoto ? (
            <JBFormButton
              variant="outline"
              action="secondary"
              text="Tomar foto"
              iconName="camera-outline"
              iconPosition="start"
              iconColor={actionColor}
              textClassName="text-[15px] font-bold text-typography-900"
              isDisabled={isBusy}
              onPress={onTakePhoto}
            />
          ) : null}
          {previewUri && onClearPreview ? (
            <JBFormButton
              variant="link"
              action="primary"
              text="Descartar selección"
              className="self-center px-0"
              isDisabled={isBusy}
              onPress={onClearPreview}
            />
          ) : null}
        </VStack>

        {previewUri ? (
          <HStack className="mt-4 w-full items-center justify-center rounded-2xl bg-primary-500/10 px-3 py-3">
            <MaterialCommunityIcons name="check-circle-outline" size={16} color="#22c55e" />
            <Text
              size="sm"
              className="ml-2 font-semibold text-primary-700 dark:text-primary-300"
            >
              Vista previa lista para guardar
            </Text>
          </HStack>
        ) : null}
      </VStack>
    </Card>
  );
};
