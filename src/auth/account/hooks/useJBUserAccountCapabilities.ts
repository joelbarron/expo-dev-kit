import { useMemo } from 'react';

import {
  getAuthAccountConfig,
  getAuthAccountScreensConfig,
  getLastCreatedJBExpoConfig,
} from '../../../config';
import {
  JBAuthAccountConfig,
  JBAuthAccountScreensConfig,
  JBAuthProfileRoleOption,
} from '../../../config/types';
import { useAppConfigStore, useAuthStore } from '../../../runtime';

export type JBUserAccountCapabilities = {
  config: JBAuthAccountScreensConfig;
  accountConfig: JBAuthAccountConfig;
  roleOptions: JBAuthProfileRoleOption[];
  showAccountSection: boolean;
  canEditDefaultProfile: boolean;
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
    const mergedConfig = {
      ...baseConfig,
      auth: {
        ...baseConfig.auth,
        ...(appConfig?.auth ?? {}),
      },
    } as any;

    const accountScreensConfig = getAuthAccountScreensConfig(mergedConfig);
    const accountConfig = getAuthAccountConfig(mergedConfig);
    const isProfileMirrorEnabled = Boolean(accountConfig.profileMirror?.enabled);

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
    const canSeeProfiles =
      accountScreensConfig.enabled &&
      accountScreensConfig.screens.profiles.enabled &&
      !isProfileMirrorEnabled;
    const canCreateProfile = canSeeProfiles && accountScreensConfig.screens.profiles.allowCreate;
    const canSwitchProfiles =
      canSeeProfiles &&
      accountScreensConfig.screens.profiles.allowSwitch &&
      profilesCount > 1;
    const canEditDefaultProfile =
      accountScreensConfig.enabled && Boolean(accountConfig.allowDefaultProfileEdit);

    const canChangePassword =
      accountScreensConfig.enabled &&
      accountScreensConfig.screens.changePassword.enabled;
    const canChangePhoto =
      accountScreensConfig.enabled &&
      accountScreensConfig.screens.photo.enabled;
    const canEditPersonalData =
      accountScreensConfig.enabled &&
      accountScreensConfig.screens.personalData.enabled;

    return {
      config: accountScreensConfig,
      accountConfig,
      roleOptions,
      showAccountSection:
        canEditDefaultProfile ||
        canSeeProfiles ||
        canChangePassword ||
        canChangePhoto ||
        canEditPersonalData,
      canEditDefaultProfile,
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
