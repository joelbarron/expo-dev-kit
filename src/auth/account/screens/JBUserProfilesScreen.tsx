import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';

import { JBMainLayout } from '../../../core';
import { JBFormButton } from '../../../forms';
import { Box, Text, VStack } from '../../../ui';
import { parseAuthError } from '../../forms/errorParser';
import { useJBUserAccountCapabilities, useJBProfiles } from '../hooks';
import { JBUserProfileList } from '../components';

const getProfileId = (profile: Record<string, any>) => profile?.id ?? profile?.pk;
const isDefaultProfile = (profile: Record<string, any>) =>
  Boolean(profile?.default ?? profile?.is_default ?? profile?.isDefault);

export function JBUserProfilesScreen() {
  const router = useRouter();
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

  useEffect(() => {
    void refreshProfiles().catch((error) => {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'Error al cargar perfiles',
        text2: parsed.rootMessage || 'No se pudieron cargar los perfiles.',
      });
    });
  }, [refreshProfiles]);

  const defaultProfileId = useMemo(
    () => (defaultProfile ? String(getProfileId(defaultProfile as any)) : null),
    [defaultProfile]
  );
  const additionalProfiles = useMemo(
    () =>
      profiles.filter((profile) => {
        const profileId = String(getProfileId(profile) ?? '');
        if (defaultProfileId && profileId && profileId === defaultProfileId) {
          return false;
        }
        return !isDefaultProfile(profile);
      }),
    [defaultProfileId, profiles]
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
        router.replace(capabilities.config.routing.homePathAfterProfileSwitch as any);
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
    void refreshProfiles().catch((error) => {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'Error al cargar perfiles',
        text2: parsed.rootMessage || 'No se pudieron cargar los perfiles.',
      });
    });
  }, [refreshProfiles]);
  const isRefreshing = isLoadingProfiles && additionalProfiles.length > 0;

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
              iconName="account-plus-outline"
              iconPosition="start"
              text="Agregar nuevo perfil"
              onPress={() => router.push('/user/profiles/create' as any)}
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

          {isLoadingProfiles && additionalProfiles.length === 0 ? (
            <Text size="md" className="text-typography-200">Cargando perfiles...</Text>
          ) : (
            <JBUserProfileList
              profiles={additionalProfiles as Array<Record<string, any>>}
              activeProfile={activeProfile as any}
              canSwitch={capabilities.canSwitchProfiles}
              switchingProfileId={isSwitchingProfileId}
              onSwitchProfile={handleSwitchProfile}
            />
          )}
        </VStack>
      </Box>
    </JBMainLayout>
  );
}
