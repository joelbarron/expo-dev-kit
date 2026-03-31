import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import Toast from 'react-native-toast-message';

import {
  getLastCreatedJBExpoConfig,
  getPermissionsConfig,
  JBAppConfig,
  JBPermissionKey,
} from '../config';
import { JBMainLayout } from '../core';
import { JBFormButton } from '../forms';
import { useAppConfigStore } from '../runtime';
import { Box, Card, HStack, Text, VStack } from '../ui';
import {
  openJBDeviceSettings,
  requestSingleJBPermission,
  refreshJBPermissions,
  useJBPermissionCatalog,
} from './hooks';
import {
  buildPermissionsGuardReminderKey,
  clearPermissionsGuardNextPromptAt,
} from './guardReminder';
import { JBPermissionState } from './types';
import { useAuthStore } from '../runtime';

const normalizePermissionList = (value: unknown): JBPermissionKey[] => {
  if (!Array.isArray(value)) return [];
  const valid = new Set<JBPermissionKey>([
    'location',
    'notifications',
    'camera',
    'media_library',
  ]);
  return value
    .map((item) => String(item ?? '').trim() as JBPermissionKey)
    .filter((item) => valid.has(item));
};

const statusMeta: Record<JBPermissionState, { label: string; colorClassName: string }> = {
  granted: {
    label: 'Concedido',
    colorClassName: 'text-green-600 dark:text-green-400',
  },
  denied: {
    label: 'Pendiente',
    colorClassName: 'text-amber-600 dark:text-amber-400',
  },
  blocked: {
    label: 'Bloqueado',
    colorClassName: 'text-red-600 dark:text-red-400',
  },
  unavailable: {
    label: 'No disponible',
    colorClassName: 'text-typography-500 dark:text-typography-400',
  },
};

const permissionIconMap: Record<JBPermissionKey, keyof typeof MaterialIcons.glyphMap> = {
  location: 'location-on',
  notifications: 'notifications-active',
  camera: 'photo-camera',
  media_library: 'photo-library',
};

export type JBPermissionsSetupScreenProps = {
  title?: string;
  continuePath?: string;
  showContinueButton?: boolean;
};

export const JBPermissionsSetupScreen = ({
  title = 'Permisos',
  continuePath,
  showContinueButton = true,
}: JBPermissionsSetupScreenProps) => {
  const router = useRouter();
  const baseConfig = getLastCreatedJBExpoConfig();
  const remoteConfig = useAppConfigStore((state: any) => state?.appConfig);
  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        permissions: {
          ...(baseConfig.permissions ?? {}),
          ...(remoteConfig?.permissions ?? {}),
        },
      } as JBAppConfig),
    [baseConfig, remoteConfig?.permissions],
  );
  const permissionsConfig = getPermissionsConfig(mergedConfig);
  const activeProfileId = useAuthStore(
    (state: any) => state?.activeProfile?.id ?? state?.defaultProfile?.id ?? null,
  );
  const authUserId = useAuthStore(
    (state: any) => state?.user?.id ?? state?.user?.pk ?? null,
  );
  const isAuthenticated = useAuthStore((state: any) => Boolean(state?.isAuthenticated));
  const requiredPermissions = useMemo(
    () => normalizePermissionList(permissionsConfig.required),
    [permissionsConfig.required],
  );
  const optionalPermissions = useMemo(
    () => normalizePermissionList(permissionsConfig.optional),
    [permissionsConfig.optional],
  );
  const permissions = useMemo(
    () => Array.from(new Set([...requiredPermissions, ...optionalPermissions])),
    [optionalPermissions, requiredPermissions],
  );
  const [permissionState, setPermissionState] = useState<Record<string, JBPermissionState>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requestingKey, setRequestingKey] = useState<JBPermissionKey | null>(null);
  const catalog = useJBPermissionCatalog(permissionState);

  const refreshPermissions = useCallback(async () => {
    if (permissions.length === 0) return;
    setIsRefreshing(true);
    try {
      const nextState = await refreshJBPermissions(permissions);
      setPermissionState(nextState);
    } finally {
      setIsRefreshing(false);
    }
  }, [permissions]);

  useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshPermissions();
      }
    });
    return () => subscription.remove();
  }, [refreshPermissions]);

  const missingRequired = useMemo(
    () =>
      requiredPermissions.filter(
        (permission) => permissionState[permission] !== 'granted'
      ),
    [permissionState, requiredPermissions],
  );
  const canContinue = missingRequired.length === 0;
  const reminderKey = useMemo(
    () =>
      buildPermissionsGuardReminderKey({
        isAuthenticated,
        userId: authUserId,
        profileId: activeProfileId,
      }),
    [activeProfileId, authUserId, isAuthenticated],
  );

  const requestPermission = useCallback(
    async (permission: JBPermissionKey) => {
      setRequestingKey(permission);
      try {
        const nextStatus = await requestSingleJBPermission(permission);
        setPermissionState((prev) => ({
          ...prev,
          [permission]: nextStatus,
        }));
      } finally {
        setRequestingKey(null);
      }
    },
    [],
  );

  useEffect(() => {
    if (!canContinue) return;
    void clearPermissionsGuardNextPromptAt(reminderKey);
  }, [canContinue, reminderKey]);

  return (
    <>
      <Stack.Screen
        options={{
          title,
        }}
      />
      <JBMainLayout
        scrollable
        footer={
          showContinueButton ? (
            <VStack className="w-full" space="sm">
              <JBFormButton
                text="Continuar"
                action="primary"
                variant="solid"
                onPress={() => {
                  if (!canContinue) {
                    Toast.show({
                      type: 'error',
                      text1: 'Faltan permisos requeridos',
                      text2: 'Concede los permisos obligatorios para continuar.',
                    });
                    return;
                  }
                  void clearPermissionsGuardNextPromptAt(reminderKey);
                  router.back();
                  if (continuePath) {
                    router.replace(continuePath as any);
                  }
                }}
              />
            </VStack>
          ) : undefined
        }
        footerClassName="px-5 py-4"
      >
        <VStack className="px-5 pt-4 pb-6" space="md">
          <VStack space="xs">
            <Text
              size="md"
              className="text-typography-700 dark:text-typography-300"
            >
              Configura los permisos necesarios para usar la app correctamente.
            </Text>
            <Text
              size="sm"
              className="text-typography-600 dark:text-typography-400"
            >
              Los permisos obligatorios están marcados y bloquean la continuación
              hasta ser concedidos.
            </Text>
          </VStack>

          {catalog.map((permission) => {
            const meta = statusMeta[permission.status];
            const isBlocked = permission.status === 'blocked';
            const isRequesting = requestingKey === permission.key;
            const isGranted = permission.status === 'granted';
            const showSettingsAction = isBlocked;
            const showGrantAction = !isGranted && !isBlocked;

            return (
              <Card key={permission.key} className="w-full px-4 py-3">
                <VStack space="sm">
                  <HStack className="items-center justify-between" space="sm">
                    <HStack className="flex-1 pr-2" space="sm">
                      <Box className="mt-0.5 rounded-md bg-background-200 p-2 dark:bg-background-700">
                        <MaterialIcons
                          name={permissionIconMap[permission.key]}
                          size={16}
                          color="#64748b"
                        />
                      </Box>
                      <VStack className="flex-1" space="xs">
                        <HStack className="items-center" space="sm">
                          <Text
                            size="md"
                            className="font-semibold text-typography-black dark:text-typography-white"
                          >
                            {permission.label}
                          </Text>
                          {permission.required ? (
                            <Box className="rounded-md border border-outline-200 bg-background-100 px-2 py-1 dark:border-outline-700 dark:bg-background-800">
                              <Text
                                size="2xs"
                                className="font-semibold text-typography-600 dark:text-typography-300"
                              >
                                Obligatorio
                              </Text>
                            </Box>
                          ) : null}
                        </HStack>
                        <Text
                          size="xs"
                          className="text-typography-600 dark:text-typography-400"
                        >
                          {permission.description}
                        </Text>
                      </VStack>
                    </HStack>
                    <Text size="xs" className={`font-semibold ${meta.colorClassName}`}>
                      {meta.label}
                    </Text>
                  </HStack>

                  {showSettingsAction || showGrantAction ? (
                    <HStack
                      className="items-center justify-center px-2 py-1"
                      space="sm"
                    >
                      {showSettingsAction ? (
                        <JBFormButton
                          text="Abrir ajustes"
                          action="primary"
                          variant="link"
                          onPress={() => void openJBDeviceSettings()}
                        />
                      ) : null}

                      {showGrantAction ? (
                        <JBFormButton
                          text={isRequesting ? 'Solicitando...' : 'Conceder'}
                          action="primary"
                          variant="link"
                          onPress={() => void requestPermission(permission.key)}
                          isDisabled={isRequesting}
                        />
                      ) : null}
                    </HStack>
                  ) : null}
                </VStack>
              </Card>
            );
          })}
        </VStack>
      </JBMainLayout>
    </>
  );
};
