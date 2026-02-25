import React from 'react';

import { VStack, Text } from '../../../ui';
import { JBUserProfileCard } from './JBUserProfileCard';

const getProfileId = (profile: Record<string, any>): string => String(profile?.id ?? profile?.pk ?? '');
const isSameProfile = (a: Record<string, any> | null | undefined, b: Record<string, any> | null | undefined) => {
  if (!a || !b) return false;
  const aId = getProfileId(a);
  const bId = getProfileId(b);
  return Boolean(aId && bId && aId === bId);
};

export type JBUserProfileListProps = {
  profiles: Array<Record<string, any>>;
  activeProfile?: Record<string, any> | null;
  canSwitch?: boolean;
  switchingProfileId?: string | null;
  onSwitchProfile?: (profile: Record<string, any>) => void;
};

export const JBUserProfileList = ({
  profiles,
  activeProfile,
  canSwitch = false,
  switchingProfileId = null,
  onSwitchProfile,
}: JBUserProfileListProps) => {
  if (!profiles.length) {
    return (
      <Text size="md" className="text-typography-300">
        No se encontraron perfiles.
      </Text>
    );
  }

  return (
    <VStack space="md">
      {profiles.map((profile, index) => {
        const profileId = getProfileId(profile) || `idx-${index}`;
        return (
          <JBUserProfileCard
            key={`${profileId}-${index}`}
            profile={profile}
            isActive={isSameProfile(profile, activeProfile)}
            canSwitch={canSwitch}
            switching={switchingProfileId === String(profileId)}
            onSwitch={onSwitchProfile}
          />
        );
      })}
    </VStack>
  );
};
