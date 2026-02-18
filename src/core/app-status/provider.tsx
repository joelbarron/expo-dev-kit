import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AppStatusClient } from './client';
import { resolveAppStatus } from './resolver';
import { AppStatusResponse, AppStatusState, AppVersionInfo } from './types';

type JBAppStatusProviderProps = {
  client: AppStatusClient;
  children: ReactNode;
  autoCheckOnMount?: boolean;
  versionChecker?: () => Promise<AppVersionInfo | null>;
};

type JBAppStatusContextValue = AppStatusState & {
  refresh: () => Promise<AppStatusResponse | null>;
};

const initialState: AppStatusState = {
  isLoading: false,
  isFetched: false,
  data: null,
  updateInfo: null,
  error: null,
  shouldBlock: false,
  blockingReason: null
};

const JBAppStatusContext = createContext<JBAppStatusContextValue | undefined>(undefined);

export function JBAppStatusProvider(props: JBAppStatusProviderProps) {
  const { client, children, autoCheckOnMount = true, versionChecker } = props;

  const [state, setState] = useState<AppStatusState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [data, updateInfo] = await Promise.all([
        client.getStatus(),
        versionChecker ? versionChecker() : Promise.resolve(null)
      ]);

      const next = resolveAppStatus({
        statusData: data,
        updateInfo
      });

      setState({
        isLoading: false,
        isFetched: true,
        data,
        updateInfo,
        error: null,
        shouldBlock: next.shouldBlock,
        blockingReason: next.blockingReason
      });

      return data;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isFetched: true,
        error
      }));

      return null;
    }
  }, [client]);

  useEffect(() => {
    if (!autoCheckOnMount) {
      return;
    }

    refresh();
  }, [autoCheckOnMount, refresh]);

  const value = useMemo<JBAppStatusContextValue>(() => ({ ...state, refresh }), [refresh, state]);

  return <JBAppStatusContext.Provider value={value}>{children}</JBAppStatusContext.Provider>;
}

export const useJBAppStatus = (): JBAppStatusContextValue => {
  const context = useContext(JBAppStatusContext);
  if (!context) {
    throw new Error('useJBAppStatus must be used within a JBAppStatusProvider');
  }

  return context;
};
