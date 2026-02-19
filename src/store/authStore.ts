import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage, createJSONStorage, persist } from 'zustand/middleware';
import { create } from 'zustand';

export type JBAuthTokens = {
  accessToken?: string | null;
  refreshToken?: string | null;
};

export type JBAuthSessionPayload = {
  user: unknown;
  accessToken?: string | null;
  refreshToken?: string | null;
};

export type JBAuthStoreState = {
  isAuthenticated: boolean;
  user: unknown | null;
  profiles: Array<Record<string, unknown>> | null;
  defaultProfile: Record<string, unknown> | null;
  activeProfile: Record<string, unknown> | null;
  accessToken: string | null;
  refreshToken: string | null;
  basicLogin: (response: Record<string, any>) => void;
  setSessionFromJBAuth: (payload: JBAuthSessionPayload) => void;
  signout: () => void;
};

export type CreateJBAuthStoreOptions = {
  storageKey?: string;
  storage?: StateStorage;
  onAccessTokenChange?: (token?: string) => void;
};

const normalizeProfiles = (user: Record<string, any>) => {
  const profilesRaw = user?.profiles ?? user?.uProfiles ?? [];
  const profiles = Array.isArray(profilesRaw) ? profilesRaw : [];
  const activeProfile = user?.activeProfile ?? user?.active_profile ?? null;
  const defaultProfile =
    profiles.find((profile: Record<string, any>) => profile?.default === true) ?? activeProfile ?? null;

  return {
    allProfiles: profiles,
    defaultProfile,
    nonDefaultProfiles: profiles.filter((profile: Record<string, any>) => profile?.default === false),
    activeProfile
  };
};

export const createJBAuthStore = (options?: CreateJBAuthStoreOptions) => {
  const storageKey = options?.storageKey ?? 'auth-storage';
  const storage = options?.storage ?? AsyncStorage;

  return create<JBAuthStoreState>()(
    persist(
      (set) => ({
        isAuthenticated: false,
        user: null,
        profiles: null,
        defaultProfile: null,
        activeProfile: null,
        accessToken: null,
        refreshToken: null,

        basicLogin: (response: Record<string, any>) => {
          const {
            tokens,
            profiles: uProfiles = [],
            activeProfile,
            active_profile,
            ...rest
          } = response;
          const accessToken = tokens?.accessToken ?? null;
          const refreshToken = tokens?.refreshToken ?? null;
          const resolvedActiveProfile = activeProfile ?? active_profile ?? null;
          const normalizedProfiles = Array.isArray(uProfiles) ? uProfiles : [];
          const resolvedDefaultProfile =
            normalizedProfiles.find((profile: Record<string, any>) => profile?.default === true) ??
            resolvedActiveProfile ??
            null;

          if (accessToken) {
            options?.onAccessTokenChange?.(accessToken);
          }

          set({
            isAuthenticated: true,
            user: rest,
            profiles: normalizedProfiles.filter((profile: Record<string, any>) => profile?.default === false),
            defaultProfile: resolvedDefaultProfile,
            activeProfile: resolvedActiveProfile,
            accessToken,
            refreshToken
          });
        },

        setSessionFromJBAuth: (payload: JBAuthSessionPayload) => {
          const user = (payload?.user as Record<string, any>) ?? {};
          const profilesState = normalizeProfiles(user);

          if (payload?.accessToken) {
            options?.onAccessTokenChange?.(payload.accessToken);
          }

          set({
            isAuthenticated: true,
            user,
            profiles: profilesState.nonDefaultProfiles,
            defaultProfile: profilesState.defaultProfile,
            activeProfile: profilesState.activeProfile,
            accessToken: payload?.accessToken ?? null,
            refreshToken: payload?.refreshToken ?? null
          });
        },

        signout: () => {
          options?.onAccessTokenChange?.();
          set({
            isAuthenticated: false,
            user: null,
            profiles: null,
            defaultProfile: null,
            activeProfile: null,
            accessToken: null,
            refreshToken: null
          });
        }
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => storage),
        onRehydrateStorage: () => (state) => {
          if (state?.accessToken) {
            options?.onAccessTokenChange?.(state.accessToken);
          }
        }
      }
    )
  );
};
