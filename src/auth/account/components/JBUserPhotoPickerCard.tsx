import { useEffect, useState } from 'react';

import { JBFormButton } from '../../../forms';
import { Avatar, AvatarFallbackText, AvatarImage, Card, HStack, Text, VStack } from '../../../ui';

type JBUserPhotoPickerCardProps = {
  currentPhotoUri?: string | null;
  previewUri?: string | null;
  displayName?: string;
  onPickFromLibrary: () => void;
  onTakePhoto?: () => void;
  onClearPreview?: () => void;
  isBusy?: boolean;
};

export const JBUserPhotoPickerCard = ({
  currentPhotoUri,
  previewUri,
  displayName = 'Perfil',
  onPickFromLibrary,
  onTakePhoto,
  onClearPreview,
  isBusy = false,
}: JBUserPhotoPickerCardProps) => {
  const imageUri = previewUri || currentPhotoUri || undefined;
  const [failedImageUri, setFailedImageUri] = useState<string | null>(null);

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
    <Card className="px-4 py-5">
      <VStack space="lg" className="items-center">
        <Avatar size="2xl" className="bg-primary-600">
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
            buttonType="edit"
            text="Seleccionar foto"
            loading={false}
            isDisabled={isBusy}
            onPress={onPickFromLibrary}
          />
          {onTakePhoto ? (
            <JBFormButton
              variant="outline"
              action="primary"
              text="Tomar foto"
              iconName="camera-outline"
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
              textClassName="text-sm font-medium text-primary-600 dark:text-primary-300"
              isDisabled={isBusy}
              onPress={onClearPreview}
            />
          ) : null}
        </VStack>

        {previewUri ? (
          <HStack className="w-full items-center justify-center rounded-xl bg-primary-500/10 px-3 py-2">
            <Text size="sm" className="text-primary-300 font-medium">Vista previa lista para guardar</Text>
          </HStack>
        ) : null}
      </VStack>
    </Card>
  );
};
