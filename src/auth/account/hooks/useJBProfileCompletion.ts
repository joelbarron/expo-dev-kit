import { useMemo } from 'react';

import { getAuthAccountConfig, JBAuthProfileFieldKey, getLastCreatedJBExpoConfig } from '../../../config';
import { useAppConfigStore, useAuthStore } from '../../../runtime';

const profileFieldAliases: Record<JBAuthProfileFieldKey, string[]> = {
  firstName: ['firstName', 'first_name'],
  lastName1: ['lastName1', 'last_name_1'],
  lastName2: ['lastName2', 'last_name_2'],
  birthday: ['birthday'],
  gender: ['gender'],
  label: ['label'],
};

const hasValue = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

const getProfileFieldValue = (
  profile: Record<string, unknown> | null,
  key: JBAuthProfileFieldKey
): unknown => {
  if (!profile) {
    return undefined;
  }
  const aliases = profileFieldAliases[key] ?? [key];
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(profile, alias)) {
      return profile[alias];
    }
  }
  return undefined;
};

export const isJBProfileComplete = (
  profile: Record<string, unknown> | null,
  requiredFields: Record<JBAuthProfileFieldKey, boolean>
): boolean => {
  return (Object.entries(requiredFields) as Array<[JBAuthProfileFieldKey, boolean]>).every(
    ([key, required]) => !required || hasValue(getProfileFieldValue(profile, key))
  );
};

export type JBProfileCompletionState = {
  enabled: boolean;
  isComplete: boolean;
  missingFields: JBAuthProfileFieldKey[];
  profileCompletionPath?: string;
  shouldPrompt: boolean;
};

export const useJBProfileCompletion = (): JBProfileCompletionState => {
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const activeProfile = useAuthStore((state: any) => state?.activeProfile);
  const defaultProfile = useAuthStore((state: any) => state?.defaultProfile);

  return useMemo(() => {
    const mergedConfig = {
      ...baseConfig,
      auth: {
        ...baseConfig.auth,
        ...(appConfig?.auth ?? {}),
      },
    } as any;
    const accountConfig = getAuthAccountConfig(mergedConfig);
    const profile = (activeProfile ?? defaultProfile ?? null) as Record<string, unknown> | null;

    const missingFields = (Object.entries(accountConfig.requiredProfileFields) as Array<
      [JBAuthProfileFieldKey, boolean]
    >)
      .filter(([key, required]) => required && !hasValue(getProfileFieldValue(profile, key)))
      .map(([key]) => key);

    const isComplete = missingFields.length === 0;
    const enabled = Boolean(accountConfig.ensureProfileCompletion);

    return {
      enabled,
      isComplete,
      missingFields,
      profileCompletionPath: accountConfig.profileCompletionPath,
      shouldPrompt: enabled && !isComplete,
    };
  }, [activeProfile, appConfig, baseConfig, defaultProfile]);
};
