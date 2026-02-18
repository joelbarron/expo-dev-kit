import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { create } from 'zustand';

export type JBThemeMode = 'light' | 'dark' | 'system';

export type JBThemeStoreState = {
  mode: JBThemeMode;
  setMode: (mode: JBThemeMode) => void;
};

export type CreateJBThemeStoreOptions = {
  storageKey?: string;
  storage?: any;
};

export const createJBThemeStore = (options?: CreateJBThemeStoreOptions) => {
  const storageKey = options?.storageKey ?? 'theme-storage';
  const storage = options?.storage ?? AsyncStorage;

  return create<JBThemeStoreState>()(
    persist(
      (set) => ({
        mode: 'system',
        setMode: (mode) => set({ mode })
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => storage)
      }
    )
  );
};
