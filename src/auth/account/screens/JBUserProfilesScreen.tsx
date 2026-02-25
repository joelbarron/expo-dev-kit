import { useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { JBFormButton } from '../../../forms';
import { Box, Text, VStack } from '../../../ui';
import { parseAuthError } from '../../forms/errorParser';
import { useJBUserAccountCapabilities, useJBProfiles } from '../hooks';
import { JBUserProfileList } from '../components';
import { AuthScreenLayout } from '../../ui';

const getProfileId = (profile: Record<string, any>) => profile?.id ?? profile?.pk;

export function JBUserProfilesScreen() {
  const router = useRouter();
  const capabilities = useJBUserAccountCapabilities();
  const {
    profiles,
    activeProfile,
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

  return (
    <AuthScreenLayout
      footerAdjustableHeight
      footerClassName="pt-4 pb-6"
      footer={
        capabilities.canCreateProfile ? (
          <VStack space="sm" className="pt-4">
            <JBFormButton
              buttonType="add"
              text="Crear perfil"
              onPress={() => router.push('/user/profiles/create' as any)}
            />
            <JBFormButton
              variant="link"
              action="primary"
              text="Refrescar lista"
              className="self-center px-0"
              textClassName="text-sm font-medium text-primary-600 dark:text-primary-300"
              onPress={() => {
                void refreshProfiles().catch((error) => {
                  const parsed = parseAuthError(error);
                  Toast.show({
                    type: 'error',
                    text1: 'Error al cargar perfiles',
                    text2: parsed.rootMessage || 'No se pudieron cargar los perfiles.',
                  });
                });
              }}
            />
          </VStack>
        ) : undefined
      }
    >
      <Box className="w-full">
        <VStack space="md">
          <Text size="sm" className="text-typography-300">
            Cambia el perfil activo para actualizar el contexto de la sesión.
          </Text>

          {isLoadingProfiles && profiles.length === 0 ? (
            <Text size="md" className="text-typography-200">Cargando perfiles...</Text>
          ) : (
            <JBUserProfileList
              profiles={profiles as Array<Record<string, any>>}
              activeProfile={activeProfile as any}
              canSwitch={capabilities.canSwitchProfiles}
              switchingProfileId={isSwitchingProfileId}
              onSwitchProfile={handleSwitchProfile}
            />
          )}

          {!capabilities.canCreateProfile ? (
            <JBFormButton
              variant="link"
              action="primary"
              text="Refrescar lista"
              className="self-start px-0"
              onPress={() => {
                void refreshProfiles().catch((error) => {
                  const parsed = parseAuthError(error);
                  Toast.show({
                    type: 'error',
                    text1: 'Error al cargar perfiles',
                    text2: parsed.rootMessage || 'No se pudieron cargar los perfiles.',
                  });
                });
              }}
            />
          ) : null}
        </VStack>
      </Box>
    </AuthScreenLayout>
  );
}
