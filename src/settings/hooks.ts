import * as Application from 'expo-application';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import {
  getLastCreatedJBExpoConfig,
  getPermissionsConfig,
  getRuntimeAppStatusConfig,
  getSettingsConfig,
  JBAppConfig,
  JBPermissionKey,
} from '../config';
import { useAppConfigStore, useThemeStore } from '../runtime';
import { resolveAppStatus } from '../core/app-status';
import { JBSettingsSection, JBPermissionItem, JBPermissionState } from './types';
import {
  getJBPermissionDefinition,
  getJBPermissionStatus,
  openDeviceSettings,
  requestJBPermission,
} from './permissions';

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

export const getCurrentAppVersion = (): string => {
  return (
    Application.nativeApplicationVersion?.trim() ||
    Application.nativeBuildVersion?.trim() ||
    ''
  );
};

type UseJBSettingsSectionsArgs = {
  onOpenNotifications?: () => void;
  onOpenPermissions?: () => void;
  onOpenSecurity?: () => void;
};

export const useJBSettingsSections = (
  args?: UseJBSettingsSectionsArgs
): JBSettingsSection[] => {
  const baseConfig = getLastCreatedJBExpoConfig();
  const remoteConfig = useAppConfigStore((state: any) => state?.appConfig);
  const updateInfo = useAppConfigStore((state: any) => state?.updateInfo);
  const themeMode = useThemeStore((state: any) => state?.mode ?? 'system');
  const setThemeMode = useThemeStore((state: any) => state?.setMode);

  return useMemo(() => {
    const mergedConfig = {
      ...baseConfig,
      settings: {
        ...(baseConfig.settings ?? {}),
        ...(remoteConfig?.settings ?? {}),
      },
      runtime: {
        ...(baseConfig.runtime ?? {}),
        ...(remoteConfig?.runtime ?? {}),
      },
    } as JBAppConfig;

    const settingsConfig = getSettingsConfig(mergedConfig);
    const appStatusConfig = getRuntimeAppStatusConfig(mergedConfig);
    const currentVersion = getCurrentAppVersion();
    const appStatus = resolveAppStatus({
      statusData: remoteConfig,
      updateInfo: updateInfo ?? null,
      strategy: appStatusConfig.strategy,
      enforceUpdateInProductionOnly: appStatusConfig.enforceUpdateInProductionOnly,
      blockOnStoreMandatoryUpdate: appStatusConfig.blockOnStoreMandatoryUpdate,
      blockOnRemoteOutdated: appStatusConfig.blockOnRemoteOutdated,
      currentVersion,
      fallbackUpdateUrl: appStatusConfig.updateUrl,
      iosStoreUrl: appStatusConfig.iosStoreUrl,
      androidStoreUrl: appStatusConfig.androidStoreUrl,
      stage: mergedConfig.stage,
      platform: Platform.OS as 'ios' | 'android' | 'web',
    });

    const latestVersion = String(
      remoteConfig?.latestVersion ??
        remoteConfig?.latest_version ??
        ''
    ).trim();
    const versionItems = settingsConfig.version?.enabled === false
      ? []
      : [
          {
            id: 'app-version',
            title: settingsConfig.version?.title ?? 'Version de la app',
            subtitle: [
              currentVersion ? `Actual: ${currentVersion}` : null,
              latestVersion ? `Ultima: ${latestVersion}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
            badge: appStatus.updateAvailable ? 'Actualización disponible' : undefined,
            rightLabel: appStatus.updateAvailable ? 'Actualizar' : undefined,
            onPress: appStatus.updateUrl
              ? () => {
                  // lazy import to avoid adding dependency in every screen
                  void import('expo-linking').then((Linking) =>
                    Linking.openURL(appStatus.updateUrl).catch(() => undefined)
                  );
                }
              : undefined,
          },
        ];

    const featureItems = [
      settingsConfig.notifications?.enabled === false
        ? null
        : {
            id: 'notifications',
            title: 'Notificaciones',
            subtitle: 'Gestiona recordatorios y avisos de actividad.',
            onPress: args?.onOpenNotifications,
          },
      settingsConfig.permissions?.enabled === false
        ? null
        : {
            id: 'permissions',
            title: 'Permisos',
            subtitle: 'Revisa y actualiza los permisos del dispositivo.',
            onPress: args?.onOpenPermissions,
          },
      settingsConfig.security?.biometricsEnabled
        ? {
            id: 'security',
            title: 'Seguridad',
            subtitle: 'Configura accesos seguros en la aplicación.',
            onPress: args?.onOpenSecurity,
          }
        : null,
    ].filter(Boolean) as Array<{
      id: string;
      title: string;
      subtitle?: string;
      onPress?: () => void;
    }>;

    const appearanceItems = settingsConfig.appearance?.enabled === false
      ? []
      : [
          {
            id: 'theme-system',
            title: 'Tema del sistema',
            subtitle: themeMode === 'system' ? 'Activo' : undefined,
            onPress: () => setThemeMode?.('system'),
          },
          {
            id: 'theme-light',
            title: 'Tema claro',
            subtitle: themeMode === 'light' ? 'Activo' : undefined,
            onPress: () => setThemeMode?.('light'),
          },
          {
            id: 'theme-dark',
            title: 'Tema oscuro',
            subtitle: themeMode === 'dark' ? 'Activo' : undefined,
            onPress: () => setThemeMode?.('dark'),
          },
        ];

    const sections: JBSettingsSection[] = [];

    if (versionItems.length > 0) {
      sections.push({
        id: 'version',
        title: 'App y versión',
        items: versionItems,
      });
    }

    if (featureItems.length > 0) {
      sections.push({
        id: 'features',
        title: 'Preferencias',
        items: featureItems,
      });
    }

    if (appearanceItems.length > 0) {
      sections.push({
        id: 'appearance',
        title: 'Apariencia',
        items: appearanceItems,
      });
    }

    return sections;
  }, [
    args?.onOpenNotifications,
    args?.onOpenPermissions,
    args?.onOpenSecurity,
    baseConfig,
    remoteConfig,
    setThemeMode,
    themeMode,
    updateInfo,
  ]);
};

export const useJBPermissionCatalog = (
  state: Record<string, JBPermissionState>
): JBPermissionItem[] => {
  const baseConfig = getLastCreatedJBExpoConfig();
  const remoteConfig = useAppConfigStore((next: any) => next?.appConfig);

  return useMemo(() => {
    const mergedConfig = {
      ...baseConfig,
      permissions: {
        ...(baseConfig.permissions ?? {}),
        ...(remoteConfig?.permissions ?? {}),
      },
    } as JBAppConfig;
    const permissionsConfig = getPermissionsConfig(mergedConfig);
    const required = normalizePermissionList(permissionsConfig.required);
    const optional = normalizePermissionList(permissionsConfig.optional);
    const keys = Array.from(new Set([...required, ...optional]));

    return keys.map((key) => {
      const definition = getJBPermissionDefinition(key);
      return {
        key,
        label: definition.label,
        description: definition.description,
        required: required.includes(key),
        status: state[key] ?? 'denied',
      };
    });
  }, [baseConfig, remoteConfig, state]);
};

export const refreshJBPermissions = async (keys: JBPermissionKey[]) => {
  const result: Record<string, JBPermissionState> = {};
  await Promise.all(
    keys.map(async (permission) => {
      result[permission] = await getJBPermissionStatus(permission);
    })
  );
  return result;
};

export const requestSingleJBPermission = requestJBPermission;
export const openJBDeviceSettings = openDeviceSettings;
