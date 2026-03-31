import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';

import { getAuthRoutesConfig, getLastCreatedJBExpoConfig } from '../../../config';
import { JBMainLayout } from '../../../core';
import { JBFormButton } from '../../../forms';
import { useAppConfigStore } from '../../../runtime';
import { Box, HStack, Text, VStack } from '../../../ui';
import { parseAuthError } from '../../forms/errorParser';
import { useJBUserAccountCapabilities, useJBProfiles } from '../hooks';
import { JBUserProfileList } from '../components';

const getProfileId = (profile: Record<string, any>) => profile?.id ?? profile?.pk;
const normalizeRoutePath = (value: unknown, fallback = '/') => {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  if (raw.startsWith('/')) return raw;
  return `/${raw.replace(/^\/+/, '')}`;
};
const isDefaultProfile = (profile: Record<string, any>) =>
  Boolean(profile?.default ?? profile?.is_default ?? profile?.isDefault);
const normalizeRole = (value: unknown) => String(value ?? '').trim().toUpperCase();

const profileFieldAliases: Record<string, string[]> = {
  first_name: ['first_name', 'firstName'],
  last_name_1: ['last_name_1', 'lastName1'],
  last_name_2: ['last_name_2', 'lastName2'],
  birthday: ['birthday'],
  gender: ['gender'],
  label: ['label'],
};

const getFieldValue = (profile: Record<string, any>, fieldName: string) => {
  const aliases = profileFieldAliases[fieldName] ?? [fieldName];
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(profile, alias)) {
      return profile[alias];
    }
  }
  return undefined;
};

const normalizeComparableValue = (fieldName: string, value: unknown) => {
  if (value == null) return '';
  if (fieldName === 'birthday') {
    const raw = String(value).trim();
    return raw.slice(0, 10);
  }
  return String(value).trim().toLowerCase();
};

const resolveCounterpartRole = (roleValue: string, rolePairs: Array<[string, string]>) => {
  for (const [left, right] of rolePairs) {
    if (left === roleValue) return right;
    if (right === roleValue) return left;
  }
  return null;
};

const ProfilesListSkeleton = () => (
  <VStack space="md">
    {[0, 1, 2].map((index) => (
      <Box
        key={`profiles-skeleton-${index}`}
        className="rounded-2xl bg-background-150 dark:bg-background-200 px-4 py-4"
      >
        <HStack className="items-center justify-between" space="md">
          <HStack className="items-center flex-1" space="md">
            <Box className="h-14 w-14 rounded-full bg-background-300 dark:bg-background-400" />
            <VStack className="flex-1" space="xs">
              <Box className="h-4 w-40 rounded-full bg-background-300 dark:bg-background-400" />
              <Box className="h-3 w-28 rounded-full bg-background-300 dark:bg-background-400" />
              <Box className="h-3 w-24 rounded-full bg-background-300 dark:bg-background-400" />
            </VStack>
          </HStack>
          <VStack space="xs">
            <Box className="h-8 w-20 rounded-full bg-background-300 dark:bg-background-400" />
            <Box className="h-8 w-20 rounded-full bg-background-300 dark:bg-background-400" />
          </VStack>
        </HStack>
      </Box>
    ))}
  </VStack>
);

export function JBUserProfilesScreen() {
  const router = useRouter();
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const capabilities = useJBUserAccountCapabilities();
  const {
    profiles,
    activeProfile,
    defaultProfile,
    isLoadingProfiles,
    isSwitchingProfileId,
    refreshProfiles,
    switchProfile,
  } = useJBProfiles();
  const isProfileMirrorEnabled = Boolean(capabilities.accountConfig.profileMirror?.enabled);
  const authRoutes = useMemo(
    () =>
      getAuthRoutesConfig({
        ...baseConfig,
        auth: {
          ...baseConfig.auth,
          ...(appConfig?.auth ?? {}),
        },
      } as any),
    [appConfig?.auth, baseConfig]
  );
  const profilesBasePath = useMemo(
    () => normalizeRoutePath(authRoutes.profilesPath, '/user/profiles'),
    [authRoutes.profilesPath]
  );

  useEffect(() => {
    if (isProfileMirrorEnabled) {
      return;
    }
    void refreshProfiles().catch((error) => {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'Error al cargar perfiles',
        text2: parsed.rootMessage || 'No se pudieron cargar los perfiles.',
      });
    });
  }, [isProfileMirrorEnabled, refreshProfiles]);

  const defaultProfileId = useMemo(
    () => (defaultProfile ? String(getProfileId(defaultProfile as any)) : null),
    [defaultProfile]
  );
  const mirrorPairs = useMemo(() => {
    const configuredPairs = capabilities.accountConfig.profileMirror?.rolePairs ?? [];
    const normalizedPairs = configuredPairs
      .map((pair) => [normalizeRole(pair?.[0]), normalizeRole(pair?.[1])] as [string, string])
      .filter(([left, right]) => Boolean(left && right));
    if (normalizedPairs.length > 0) {
      return normalizedPairs;
    }
    return [['HOST', 'GUEST']] as Array<[string, string]>;
  }, [capabilities.accountConfig.profileMirror?.rolePairs]);
  const mirrorSyncFields = useMemo(() => {
    const configuredFields = capabilities.accountConfig.profileMirror?.syncFields ?? [];
    const normalizedFields = configuredFields
      .map((field) => String(field ?? '').trim())
      .filter(Boolean)
      .filter((field) => field !== 'picture');
    if (normalizedFields.length > 0) {
      return normalizedFields;
    }
    return ['first_name', 'last_name_1', 'last_name_2', 'birthday', 'gender', 'label'];
  }, [capabilities.accountConfig.profileMirror?.syncFields]);

  const inferredDefaultProfile = (defaultProfile ?? null) as Record<string, any> | null;
  const additionalProfiles = useMemo(
    () =>
      profiles.filter((profile) => {
        const profileId = String(getProfileId(profile) ?? '');
        if (defaultProfileId && profileId && profileId === defaultProfileId) {
          return false;
        }
        if (isDefaultProfile(profile)) {
          return false;
        }

        if (!isProfileMirrorEnabled || !inferredDefaultProfile) {
          return true;
        }

        const defaultRole = normalizeRole(
          inferredDefaultProfile?.role ?? inferredDefaultProfile?.role_value
        );
        const profileRole = normalizeRole(profile?.role ?? profile?.role_value);
        if (!defaultRole || !profileRole) {
          return true;
        }

        const counterpartRole = resolveCounterpartRole(defaultRole, mirrorPairs);
        if (!counterpartRole || counterpartRole !== profileRole) {
          return true;
        }

        const comparableFields = mirrorSyncFields.filter((fieldName) => fieldName !== 'picture');
        if (comparableFields.length === 0) {
          return true;
        }

        const isLikelyMirrored = comparableFields.every((fieldName) => {
          const defaultValue = normalizeComparableValue(
            fieldName,
            getFieldValue(inferredDefaultProfile, fieldName)
          );
          const profileValue = normalizeComparableValue(
            fieldName,
            getFieldValue(profile, fieldName)
          );
          return defaultValue === profileValue;
        });

        return !isLikelyMirrored;
      }),
    [
      defaultProfileId,
      inferredDefaultProfile,
      isProfileMirrorEnabled,
      mirrorPairs,
      mirrorSyncFields,
      profiles,
    ]
  );

  const handleSwitchProfile = useCallback(
    async (profile: Record<string, any>) => {
      const profileId = getProfileId(profile);
      const activeId = getProfileId(activeProfile as any);
      if (profileId == null || String(profileId) === String(activeId)) {
        return;
      }

      try {
        await switchProfile(profileId);
        Toast.show({
          type: 'success',
          text1: 'Perfil cambiado',
          text2: 'Se actualizó el perfil activo correctamente.',
        });
        router.replace(
          normalizeRoutePath(capabilities.config.routing.homePathAfterProfileSwitch) as any
        );
      } catch (error) {
        const parsed = parseAuthError(error);
        Toast.show({
          type: 'error',
          text1: 'No se pudo cambiar el perfil',
          text2: parsed.rootMessage || 'Inténtalo de nuevo.',
        });
      }
    },
    [activeProfile, capabilities.config.routing.homePathAfterProfileSwitch, router, switchProfile]
  );

  const handleRefresh = useCallback(() => {
    if (isProfileMirrorEnabled) {
      return;
    }
    void refreshProfiles().catch((error) => {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'Error al cargar perfiles',
        text2: parsed.rootMessage || 'No se pudieron cargar los perfiles.',
      });
    });
  }, [isProfileMirrorEnabled, refreshProfiles]);
  const handleEditProfile = useCallback(
    (profile: Record<string, any>) => {
      const profileId = getProfileId(profile);
      if (profileId == null) {
        return;
      }
      router.push(`${profilesBasePath}/edit/${profileId}` as any);
    },
    [profilesBasePath, router]
  );
  const isRefreshing =
    !isProfileMirrorEnabled && isLoadingProfiles && additionalProfiles.length > 0;

  return (
    <JBMainLayout
      scrollable
      className="flex-1 bg-background-100 dark:bg-background-0"
      classNameScrollView="flex-1"
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
      footerClassName="pt-4 pb-6"
      footer={
        capabilities.canCreateProfile ? (
          <VStack space="sm">
            <JBFormButton
              variant="solid"
              action="primary"
              text="Agregar nuevo perfil"
              onPress={() => router.push(`${profilesBasePath}/create` as any)}
            />
          </VStack>
        ) : undefined
      }
    >
      <Box className="w-full px-6 pt-6">
        <VStack space="md">
          <Text size="sm" className="text-typography-500 dark:text-typography-300">
            Gestiona perfiles adicionales de la cuenta y cambia el perfil activo cuando lo necesites.
          </Text>

          {isProfileMirrorEnabled ? (
            <Box className="rounded-2xl bg-background-150 px-4 py-4 dark:bg-background-200">
              <Text size="sm" className="text-typography-600 dark:text-typography-300">
                La gestión de perfiles adicionales no está disponible porque la sincronización de
                perfiles está habilitada.
              </Text>
            </Box>
          ) : null}

          {!isProfileMirrorEnabled && isLoadingProfiles && additionalProfiles.length === 0 ? (
            <ProfilesListSkeleton />
          ) : !isProfileMirrorEnabled ? (
            <JBUserProfileList
              profiles={additionalProfiles as Array<Record<string, any>>}
              activeProfile={activeProfile as any}
              canSwitch={capabilities.canSwitchProfiles}
              canEditProfile
              switchingProfileId={isSwitchingProfileId}
              onSwitchProfile={handleSwitchProfile}
              onEditProfile={handleEditProfile}
            />
          ) : null}
        </VStack>
      </Box>
    </JBMainLayout>
  );
}
