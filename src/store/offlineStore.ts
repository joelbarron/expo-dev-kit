import { create } from 'zustand';

import { JBOfflineMode } from '../config';

export type JBOfflineStoreState = {
  mode: JBOfflineMode;
  isOffline: boolean;
  continueOffline: boolean;
  setMode: (mode: JBOfflineMode) => void;
  setConnectivity: (isConnected: boolean) => void;
  continueOfflineReadOnly: () => void;
  clearOfflineReadOnly: () => void;
};

export type CreateJBOfflineStoreOptions = {
  mode?: JBOfflineMode;
};

export const createJBOfflineStore = (options?: CreateJBOfflineStoreOptions) => {
  const initialMode = options?.mode ?? 'blocking_with_offline';

  return create<JBOfflineStoreState>()((set) => ({
    mode: initialMode,
    isOffline: false,
    continueOffline: false,
    setMode: (mode) => {
      set((prev) => ({
        mode,
        continueOffline:
          mode === 'strict_blocking' ? false : prev.continueOffline,
      }));
    },
    setConnectivity: (isConnected) => {
      set((prev) => ({
        isOffline: !isConnected,
        continueOffline: isConnected ? false : prev.continueOffline,
      }));
    },
    continueOfflineReadOnly: () => {
      set((prev) => {
        if (prev.mode === 'strict_blocking') {
          return prev;
        }
        return {
          ...prev,
          continueOffline: true,
        };
      });
    },
    clearOfflineReadOnly: () => {
      set((prev) => ({
        ...prev,
        continueOffline: false,
      }));
    },
  }));
};
