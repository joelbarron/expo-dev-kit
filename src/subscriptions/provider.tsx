import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { BillingClient } from './client';
import {
  addCustomerInfoListener,
  configurePurchases,
  isPurchasesAvailable,
  logoutPurchases
} from './purchases';
import { billingQueryKeys, createBillingQueryHooks, BillingQueryHooks } from './query';

export type JBBillingProviderConfig = {
  apiKeyIos?: string;
  apiKeyAndroid?: string;
  debug?: boolean;
};

export type JBBillingContextValue = {
  appUserId: string | null;
  isReady: boolean;
  purchasesAvailable: boolean;
  paywallVisible: boolean;
  paywallReason: string | null;
  lastError: string | null;
  triggerPaywall: (reason?: string) => void;
  dismissPaywall: () => void;
  hooks: BillingQueryHooks;
};

const JBBillingContext = createContext<JBBillingContextValue | null>(null);

export type JBBillingProviderProps = {
  children: ReactNode;
  billingClient: BillingClient;
  appUserId?: string | null;
  config: JBBillingProviderConfig;
  autoSyncOnAuth?: boolean;
};

export const JBBillingProvider: React.FC<JBBillingProviderProps> = ({
  children,
  billingClient,
  appUserId = null,
  config,
  autoSyncOnAuth = true
}) => {
  const queryClient = useQueryClient();
  const hooks = useMemo(() => createBillingQueryHooks(billingClient), [billingClient]);
  const purchasesAvailable = useMemo(() => isPurchasesAvailable(), []);

  const [isReady, setIsReady] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const lastConfiguredUserRef = useRef<string | null>(null);

  // (Re)configure RevenueCat when the appUserId changes.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!appUserId) {
        if (lastConfiguredUserRef.current && purchasesAvailable) {
          await logoutPurchases();
        }
        lastConfiguredUserRef.current = null;
        setIsReady(false);
        return;
      }
      if (lastConfiguredUserRef.current === appUserId) {
        setIsReady(true);
        return;
      }
      const ok = await configurePurchases({
        apiKeyIos: config.apiKeyIos,
        apiKeyAndroid: config.apiKeyAndroid,
        appUserId,
        debug: config.debug
      });
      if (cancelled) return;
      lastConfiguredUserRef.current = appUserId;
      setIsReady(ok);
      if (!ok) {
        setLastError('configure_failed');
      } else {
        setLastError(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [appUserId, config.apiKeyAndroid, config.apiKeyIos, config.debug, purchasesAvailable]);

  // Trigger initial backend sync when ready.
  const syncMobile = hooks.useSyncMobileMutation();
  const syncedUserRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoSyncOnAuth) return;
    if (!appUserId) {
      syncedUserRef.current = null;
      return;
    }
    if (!isReady) return;
    if (syncedUserRef.current === appUserId) return;
    syncedUserRef.current = appUserId;
    syncMobile.mutate(
      { platform: Platform.OS === 'ios' ? 'ios' : 'android', appUserId },
      {
        onError: (err: any) => {
          setLastError(err?.message ?? 'sync_failed');
        }
      }
    );
  }, [appUserId, autoSyncOnAuth, isReady, syncMobile]);

  // Customer info listener → invalidate status query.
  useEffect(() => {
    if (!isReady || !purchasesAvailable) return;
    const unsubscribe = addCustomerInfoListener(() => {
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.all });
    });
    return unsubscribe;
  }, [isReady, purchasesAvailable, queryClient]);

  const triggerPaywall = useCallback((reason?: string) => {
    setPaywallReason(reason ?? null);
    setPaywallVisible(true);
  }, []);

  const dismissPaywall = useCallback(() => {
    setPaywallVisible(false);
    setPaywallReason(null);
  }, []);

  const value = useMemo<JBBillingContextValue>(
    () => ({
      appUserId,
      isReady,
      purchasesAvailable,
      paywallVisible,
      paywallReason,
      lastError,
      triggerPaywall,
      dismissPaywall,
      hooks
    }),
    [
      appUserId,
      isReady,
      purchasesAvailable,
      paywallVisible,
      paywallReason,
      lastError,
      triggerPaywall,
      dismissPaywall,
      hooks
    ]
  );

  return <JBBillingContext.Provider value={value}>{children}</JBBillingContext.Provider>;
};

export const useJBBilling = (): JBBillingContextValue => {
  const ctx = useContext(JBBillingContext);
  if (!ctx) {
    throw new Error('useJBBilling must be used inside <JBBillingProvider>');
  }
  return ctx;
};
