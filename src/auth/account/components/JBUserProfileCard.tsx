import React from 'react';

import { JBFormButton } from '../../../forms';
import { useColorScheme } from '../../../hooks';
import { Avatar, AvatarFallbackText, AvatarImage, Box, HStack, Text, VStack } from '../../../ui';
import { getProfileFullName, getProfilePictureUri } from '../../utils';

const getProfileId = (profile: Record<string, any>): string => String(profile?.id ?? profile?.pk ?? '');
const getRoleLabel = (profile: Record<string, any>) => String(profile?.roleLabel ?? profile?.role_label ?? profile?.role ?? '');

export type JBUserProfileCardProps = {
  profile: Record<string, any>;
  isActive?: boolean;
  canSwitch?: boolean;
  switching?: boolean;
  onSwitch?: (profile: Record<string, any>) => void;
};

export const JBUserProfileCard = ({
  profile,
  isActive = false,
  canSwitch = false,
  switching = false,
  onSwitch,
}: JBUserProfileCardProps) => {
  const colorScheme = useColorScheme();
  const profileName = getProfileFullName(profile) || String(profile?.name ?? profile?.username ?? 'Perfil');
  const roleLabel = getRoleLabel(profile);
  const username = typeof profile?.username === 'string' ? profile.username : '';
  const subtitle = [roleLabel, username ? `@${username}` : ''].filter(Boolean).join(' • ');
  const picture = getProfilePictureUri(profile);
  const profileId = getProfileId(profile);
  const titleClassName =
    colorScheme === 'dark' ? 'text-typography-50' : 'text-typography-900';
  const subtitleClassName =
    colorScheme === 'dark' ? 'text-typography-300' : 'text-typography-600';

  return (
    <Box
      className={`rounded-2xl px-4 py-4 ${
        isActive
          ? 'bg-primary-500/10'
          : 'bg-background-150 dark:bg-background-200'
      }`}
    >
      <HStack className="items-center justify-between" space="md">
        <HStack className="items-center flex-1" space="md">
          <Avatar size="lg" className="bg-primary-500">
            {picture ? <AvatarImage source={{ uri: picture }} /> : null}
            <AvatarFallbackText>{profileName}</AvatarFallbackText>
          </Avatar>
          <VStack className="flex-1" space="xs">
            <Text bold size="md" className={titleClassName}>
              {profileName}
            </Text>
            {subtitle ? (
              <Text size="sm" className={subtitleClassName}>
                {subtitle}
              </Text>
            ) : null}
            <Text
              size="xs"
              className={
                isActive
                  ? 'text-primary-700 dark:text-primary-300 font-semibold'
                  : 'text-typography-400 dark:text-typography-400'
              }
            >
              {isActive ? 'Perfil activo' : `Perfil #${profileId}`}
            </Text>
          </VStack>
        </HStack>

        {isActive ? (
          <JBFormButton
            variant="outline"
            action="primary"
            text="Activo"
            showIcon={false}
            isDisabled
            className="px-3"
            textClassName="text-sm font-semibold"
          />
        ) : canSwitch ? (
          <JBFormButton
            variant="outline"
            action="primary"
            text="Cambiar"
            loading={switching}
            isDisabled={switching}
            className="px-3"
            onPress={() => onSwitch?.(profile)}
          />
        ) : null}
      </HStack>
    </Box>
  );
};
