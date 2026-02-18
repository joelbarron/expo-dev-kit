import * as SecureStore from 'expo-secure-store';

import { TokenStorage } from './types';

export type CreateSecureStoreTokenStorageOptions = {
  accessTokenKey?: string;
  refreshTokenKey?: string;
};

export const createSecureStoreTokenStorage = (
  options?: CreateSecureStoreTokenStorageOptions
): TokenStorage => {
  const accessTokenKey = options?.accessTokenKey ?? 'jwt_access_token';
  const refreshTokenKey = options?.refreshTokenKey ?? 'jwt_refresh_token';

  return {
    getAccessToken: () => SecureStore.getItemAsync(accessTokenKey),
    setAccessToken: (token: string) => SecureStore.setItemAsync(accessTokenKey, token),
    removeAccessToken: () => SecureStore.deleteItemAsync(accessTokenKey),
    getRefreshToken: () => SecureStore.getItemAsync(refreshTokenKey),
    setRefreshToken: (token: string) => SecureStore.setItemAsync(refreshTokenKey, token),
    removeRefreshToken: () => SecureStore.deleteItemAsync(refreshTokenKey)
  };
};
