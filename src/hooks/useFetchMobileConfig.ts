import { Platform } from 'react-native';

export const createJBFetchMobileConfig = <TConfig extends Record<string, any>>(
  fetchMobileConfig: () => Promise<TConfig>
) => {
  return async () => {
    const config = await fetchMobileConfig();
    return config[Platform.OS];
  };
};
