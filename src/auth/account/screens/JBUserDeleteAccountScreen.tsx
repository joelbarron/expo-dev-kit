import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { JBFormButton, JBFormCheckbox } from '../../../forms';
import { Box, Text, VStack } from '../../../ui';
import { parseAuthError } from '../../forms/errorParser';
import { useJBAuth } from '../../provider';
import { AuthScreenLayout } from '../../ui';

export function JBUserDeleteAccountScreen() {
  const auth = useJBAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { control, watch } = useForm<{ acceptDelete: boolean }>({
    defaultValues: {
      acceptDelete: false,
    },
  });
  const acceptDelete = watch('acceptDelete');

  const handleDeleteAccount = async () => {
    if (!acceptDelete) {
      Toast.show({
        type: 'info',
        text1: 'Confirmacion requerida',
        text2: 'Debes confirmar que deseas eliminar la cuenta.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await auth.deleteAccount({ confirmation: true });
      await auth.signOut();
      Toast.show({
        type: 'success',
        text1: 'Cuenta eliminada',
      });
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'No se pudo eliminar la cuenta',
        text2: parsed.rootMessage || 'Intenta de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Eliminar cuenta"
      subtitle="Esta accion es permanente. Verifica la politica de negocio antes de habilitarla en produccion."
      footerAdjustableHeight
      footerClassName="pt-4 pb-6"
      footer={
        <JBFormButton
          variant="solid"
          action="negative"
          text="Eliminar cuenta"
          loading={isLoading}
          isDisabled={!acceptDelete}
          onPress={() => void handleDeleteAccount()}
        />
      }
    >
      <Box className="w-full">
        <VStack space="lg">
          <Box className="rounded-2xl border border-outline-200 bg-background-100 p-4">
            <VStack space="sm">
              <Text size="md" className="font-semibold text-typography-900">
                Antes de continuar
              </Text>
              <Text size="sm" className="text-typography-600">
                Al eliminar tu cuenta se cerrara la sesion actual y no podras recuperar los datos desde la app.
              </Text>
            </VStack>
          </Box>

          <JBFormCheckbox
            control={control}
            fieldName="acceptDelete"
            label="Entiendo que esta accion elimina mi cuenta"
          />
        </VStack>
      </Box>
    </AuthScreenLayout>
  );
}
