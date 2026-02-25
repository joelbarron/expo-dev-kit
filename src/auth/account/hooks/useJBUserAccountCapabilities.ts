import { useMemo } from 'react';

import { getLastCreatedJBExpoConfig } from '../../../config';
import { JBAuthProfileRoleOption, JBAuthUserSettingsConfig } from '../../../config/types';
import { useAppConfigStore, useAuthStore } from '../../../runtime';

const pickBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

const mergeUserSettings = (
  base: JBAuthUserSettingsConfig,
  override: Partial<JBAuthUserSettingsConfig> | undefined
): JBAuthUserSettingsConfig => ({
  enabled: pickBoolean(override?.enabled, base.enabled),
  routing: {
    homePathAfterProfileSwitch:
      override?.routing?.homePathAfterProfileSwitch ?? base.routing.homePathAfterProfileSwitch,
  },
  screens: {
    profiles: {
      enabled: pickBoolean(override?.screens?.profiles?.enabled, base.screens.profiles.enabled),
      allowSwitch: pickBoolean(override?.screens?.profiles?.allowSwitch, base.screens.profiles.allowSwitch),
      allowCreate: pickBoolean(override?.screens?.profiles?.allowCreate, base.screens.profiles.allowCreate),
    },
    changePassword: {
      enabled: pickBoolean(
        override?.screens?.changePassword?.enabled,
        base.screens.changePassword.enabled
      ),
    },
    photo: {
      enabled: pickBoolean(override?.screens?.photo?.enabled, base.screens.photo.enabled),
      crop: {
        enabled: pickBoolean(override?.screens?.photo?.crop?.enabled, base.screens.photo.crop.enabled),
        allowsEditing: pickBoolean(
          override?.screens?.photo?.crop?.allowsEditing,
          base.screens.photo.crop.allowsEditing
        ),
        aspect: override?.screens?.photo?.crop?.aspect ?? base.screens.photo.crop.aspect,
      },
    },
    personalData: {
      enabled: pickBoolean(
        override?.screens?.personalData?.enabled,
        base.screens.personalData.enabled
      ),
    },
  },
});

export type JBUserAccountCapabilities = {
  config: JBAuthUserSettingsConfig;
  roleOptions: JBAuthProfileRoleOption[];
  showAccountSection: boolean;
  canSeeProfiles: boolean;
  canSwitchProfiles: boolean;
  canCreateProfile: boolean;
  canChangePassword: boolean;
  canChangePhoto: boolean;
  canEditPersonalData: boolean;
  profilesCount: number;
};

export const useJBUserAccountCapabilities = (): JBUserAccountCapabilities => {
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const activeProfile = useAuthStore((state: any) => state?.activeProfile);
  const defaultProfile = useAuthStore((state: any) => state?.defaultProfile);
  const nonDefaultProfiles = useAuthStore((state: any) => state?.profiles);

  return useMemo(() => {
    const mergedUserSettings = mergeUserSettings(
      baseConfig.auth.userSettings,
      appConfig?.auth?.userSettings
    );

    const roleOptions = (appConfig?.auth?.profileRoles ?? baseConfig.auth.profileRoles ?? []) as JBAuthProfileRoleOption[];
    const profilesList = [defaultProfile, activeProfile, ...(Array.isArray(nonDefaultProfiles) ? nonDefaultProfiles : [])]
      .filter(Boolean)
      .reduce<Array<Record<string, unknown>>>((acc, profile: any) => {
        const id = profile?.id ?? profile?.pk;
        if (!id) {
          acc.push(profile);
          return acc;
        }
        if (!acc.some((item: any) => (item?.id ?? item?.pk) === id)) {
          acc.push(profile);
        }
        return acc;
      }, []);

    const profilesCount = profilesList.length;
    const canSeeProfiles = mergedUserSettings.enabled && mergedUserSettings.screens.profiles.enabled;
    const canCreateProfile = canSeeProfiles && mergedUserSettings.screens.profiles.allowCreate;
    const canSwitchProfiles =
      canSeeProfiles &&
      mergedUserSettings.screens.profiles.allowSwitch &&
      profilesCount > 1;

    const canChangePassword = mergedUserSettings.enabled && mergedUserSettings.screens.changePassword.enabled;
    const canChangePhoto = mergedUserSettings.enabled && mergedUserSettings.screens.photo.enabled;
    const canEditPersonalData = mergedUserSettings.enabled && mergedUserSettings.screens.personalData.enabled;

    return {
      config: mergedUserSettings,
      roleOptions,
      showAccountSection:
        canSeeProfiles || canChangePassword || canChangePhoto || canEditPersonalData,
      canSeeProfiles,
      canSwitchProfiles,
      canCreateProfile,
      canChangePassword,
      canChangePhoto,
      canEditPersonalData,
      profilesCount,
    };
  }, [activeProfile, appConfig, baseConfig, defaultProfile, nonDefaultProfiles]);
};
