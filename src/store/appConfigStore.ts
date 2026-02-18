import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { create } from 'zustand';

export type JBAppConfigStoreState<TUpdate = unknown, TConfig = unknown> = {
  updateInfo: TUpdate | null;
  appConfig: TConfig | null;
  isConfigLoaded: boolean;
  fetchAppConfig: () => Promise<void>;
};

export type CreateJBAppConfigStoreOptions<TUpdate = unknown, TConfig = unknown> = {
  storageKey?: string;
  storage?: any;
  fetchVersionInfo?: () => Promise<TUpdate>;
  fetchMobileConfig?: () => Promise<TConfig>;
};

export const createJBAppConfigStore = <TUpdate = unknown, TConfig = unknown>(
  options?: CreateJBAppConfigStoreOptions<TUpdate, TConfig>
) => {
  const storageKey = options?.storageKey ?? 'app-config-storage';
  const storage = options?.storage ?? AsyncStorage;

  return create<JBAppConfigStoreState<TUpdate, TConfig>>()( 
    persist(
      (set) => ({
        updateInfo: null,
        appConfig: null,
        isConfigLoaded: false,

        fetchAppConfig: async () => {
          try {
            let version: TUpdate | null = null;
            let config: TConfig | null = null;

            try {
              version = options?.fetchVersionInfo ? await options.fetchVersionInfo() : ({} as TUpdate);
            } catch (error) {
              console.warn('fetchVersionInfo failed:', error);
              version = {} as TUpdate;
            }

            try {
              config = options?.fetchMobileConfig ? await options.fetchMobileConfig() : ({} as TConfig);
            } catch (error) {
              console.warn('fetchMobileConfig failed:', error);
              config = {} as TConfig;
            }

            set({
              updateInfo: version,
              appConfig: config,
              isConfigLoaded: true
            });
          } catch (error) {
            console.warn('Unexpected error during fetchAppConfig:', error);
            set({
              updateInfo: null,
              appConfig: null,
              isConfigLoaded: true
            });
          }
        }
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => storage),
        partialize: (state) => ({
          updateInfo: state.updateInfo,
          appConfig: state.appConfig
        })
      }
    )
  );
};
