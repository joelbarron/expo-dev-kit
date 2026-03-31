import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';

import {
  getLastCreatedJBExpoConfig,
  getSettingsConfig,
  JBAppConfig,
} from '../config';
import { JBMainLayout } from '../core';
import { JBFormButton } from '../forms';
import { useAppConfigStore } from '../runtime';
import { Box, Card, HStack, Text, VStack } from '../ui';
import { openJBDeviceSettings } from './hooks';
import { useJBBiometricsState } from './biometrics';

export type JBSettingsSecurityScreenProps = {
  title?: string;
};

export const JBSettingsSecurityScreen = ({
  title = 'Seguridad',
}: JBSettingsSecurityScreenProps) => {
  const baseConfig = getLastCreatedJBExpoConfig();
  const remoteConfig = useAppConfigStore((state: any) => state?.appConfig);
  const [isSaving, setIsSaving] = useState(false);
  const {
    availability,
    isAvailabilityLoaded,
    isEnabled,
    setEnabled,
    setPromptDismissed,
    authenticate,
  } = useJBBiometricsState();

  const settingsConfig = useMemo(
    () =>
      getSettingsConfig({
        ...baseConfig,
        settings: {
          ...(baseConfig.settings ?? {}),
          ...(remoteConfig?.settings ?? {}),
        },
      } as JBAppConfig),
    [baseConfig, remoteConfig?.settings]
  );

  const securityConfig = settingsConfig.security ?? {};
  const biometricsFeatureEnabled = Boolean(securityConfig.biometricsEnabled);
  const allowDeviceCredentialFallback =
    securityConfig.allowDeviceCredentialFallback !== false;
  const biometricLabel = availability?.label ?? 'Biometría';
  const isCompatible = Boolean(availability?.hasHardware);
  const isEnrolled = Boolean(availability?.isEnrolled);

  const statusText = !biometricsFeatureEnabled
    ? 'Deshabilitado por configuración'
    : !isAvailabilityLoaded
    ? 'Verificando dispositivo'
    : !isCompatible
    ? 'No compatible en este dispositivo'
    : !isEnrolled
    ? 'Biometría no configurada'
    : isEnabled
    ? `${biometricLabel} activado`
    : `${biometricLabel} desactivado`;

  const statusToneClassName = !biometricsFeatureEnabled
    ? 'text-typography-600 dark:text-typography-400'
    : isEnabled
    ? 'text-green-600 dark:text-green-400'
    : 'text-typography-600 dark:text-typography-300';

  const handleToggle = async () => {
    if (!biometricsFeatureEnabled) {
      Toast.show({
        type: 'info',
        text1: 'Función deshabilitada',
        text2: 'La biometría no está habilitada en la configuración.',
      });
      return;
    }

    if (!isAvailabilityLoaded) {
      Toast.show({
        type: 'info',
        text1: 'Espera un momento',
        text2: 'Estamos validando la compatibilidad del dispositivo.',
      });
      return;
    }

    if (!isCompatible || !isEnrolled) {
      Toast.show({
        type: 'error',
        text1: 'Biometría no disponible',
        text2:
          'Configura la biometría en ajustes del dispositivo para continuar.',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isEnabled) {
        await setEnabled(false);
        Toast.show({
          type: 'success',
          text1: 'Biometría desactivada',
          text2: 'El desbloqueo biométrico quedó deshabilitado.',
        });
        return;
      }

      const result = await authenticate({
        context: 'enable',
        label: biometricLabel,
        allowDeviceCredentialFallback,
      });

      if (!result.success) {
        Toast.show({
          type: 'info',
          text1: 'Activación cancelada',
          text2: `No se activó ${biometricLabel}.`,
        });
        return;
      }

      await setEnabled(true);
      await setPromptDismissed(false);
      Toast.show({
        type: 'success',
        text1: 'Biometría activada',
        text2: `Ya puedes desbloquear con ${biometricLabel}.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title }} />
      <JBMainLayout scrollable>
        <VStack className="flex-1 px-5 pt-4 pb-6" space="lg">
          <VStack space="xs">
            <Text
              size="md"
              className="text-typography-700 dark:text-typography-300"
            >
              Protege tu sesión con desbloqueo biométrico.
            </Text>
            <Text
              size="sm"
              className="text-typography-600 dark:text-typography-400"
            >
              Puedes activar o desactivar {biometricLabel} en cualquier momento.
            </Text>
          </VStack>

          <Card className="w-full px-4 py-4">
            <VStack space="md">
              <HStack className="items-center justify-between" space="sm">
                <HStack className="flex-1 pr-2" space="sm">
                  <Box className="mt-0.5 rounded-md bg-background-200 p-2 dark:bg-background-700">
                    <MaterialIcons
                      name="fingerprint"
                      size={16}
                      color="#64748b"
                    />
                  </Box>
                  <VStack className="flex-1" space="xs">
                    <Text
                      size="md"
                      className="font-semibold text-typography-black dark:text-typography-white"
                    >
                      Desbloqueo biométrico
                    </Text>
                    <Text
                      size="xs"
                      className="text-typography-600 dark:text-typography-400"
                    >
                      Estado: <Text className={`font-semibold ${statusToneClassName}`}>{statusText}</Text>
                    </Text>
                  </VStack>
                </HStack>
              </HStack>

              <JBFormButton
                text={isEnabled ? `Desactivar ${biometricLabel}` : `Activar ${biometricLabel}`}
                action="primary"
                variant={isEnabled ? 'outline' : 'solid'}
                onPress={() => void handleToggle()}
                loading={isSaving}
              />

              {!isCompatible || !isEnrolled ? (
                <JBFormButton
                  text="Abrir ajustes del dispositivo"
                  action="secondary"
                  variant="link"
                  onPress={() => void openJBDeviceSettings()}
                />
              ) : null}
            </VStack>
          </Card>
        </VStack>
      </JBMainLayout>
    </>
  );
};
