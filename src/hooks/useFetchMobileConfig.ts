import { Platform } from 'react-native';

const normalizeMobileConfig = <TConfig extends Record<string, any>>(
  config: TConfig | null | undefined
) => {
  if (!config || typeof config !== 'object') {
    return config as TConfig;
  }

  const underMaintenance =
    config.underMaintenance ?? config.under_maintenance ?? false;
  const latestVersion = config.latestVersion ?? config.latest_version;
  const outdatedMessage = config.outdatedMessage ?? config.outdated_message;

  return {
    ...config,
    underMaintenance: Boolean(underMaintenance),
    latestVersion: latestVersion ?? null,
    outdatedMessage: outdatedMessage ?? null,
  } as TConfig;
};

export const createJBFetchMobileConfig = <TConfig extends Record<string, any>>(
  fetchMobileConfig: () => Promise<TConfig>
) => {
  return async () => {
    const config = await fetchMobileConfig();
    const platformConfig = config?.[Platform.OS];
    return normalizeMobileConfig(platformConfig);
  };
};
