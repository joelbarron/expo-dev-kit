import React from 'react';

import { JBFormButton } from '../../../forms';
import { Avatar, AvatarFallbackText, AvatarImage, Box, HStack, Text, VStack } from '../../../ui';
import { getProfileFullName } from '../../utils';

const getProfileId = (profile: Record<string, any>): string => String(profile?.id ?? profile?.pk ?? '');
const getRoleLabel = (profile: Record<string, any>) => String(profile?.roleLabel ?? profile?.role_label ?? profile?.role ?? '');
const getPicture = (profile: Record<string, any>) =>
  (typeof profile?.picture === 'string' && profile.picture) ||
  (typeof profile?.avatar === 'string' && profile.avatar) ||
  (typeof profile?.image === 'string' && profile.image) ||
  undefined;

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
  const profileName = getProfileFullName(profile) || String(profile?.name ?? profile?.username ?? 'Perfil');
  const roleLabel = getRoleLabel(profile);
  const username = typeof profile?.username === 'string' ? profile.username : '';
  const subtitle = [roleLabel, username ? `@${username}` : ''].filter(Boolean).join(' • ');
  const picture = getPicture(profile);
  const profileId = getProfileId(profile);

  return (
    <Box className={`rounded-2xl border px-4 py-4 ${isActive ? 'border-primary-500 bg-primary-500/10' : 'border-outline-200 bg-background-100'}`}>
      <HStack className="items-center justify-between" space="md">
        <HStack className="items-center flex-1" space="md">
          <Avatar size="md" className="bg-primary-600">
            {picture ? <AvatarImage source={{ uri: picture }} /> : null}
            <AvatarFallbackText>{profileName}</AvatarFallbackText>
          </Avatar>
          <VStack className="flex-1" space="xs">
            <Text bold size="md" className="text-white">{profileName}</Text>
            {subtitle ? (
              <Text size="sm" className="text-typography-300">{subtitle}</Text>
            ) : null}
            <Text size="xs" className={isActive ? 'text-primary-300 font-semibold' : 'text-typography-400'}>
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
