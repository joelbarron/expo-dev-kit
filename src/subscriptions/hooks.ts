import { useMemo } from 'react';

import { useJBBilling } from './provider';
import { BillingTrialInfo } from './types';

/**
 * Returns whether the active session has the requested entitlement key.
 * Internally consumes `useBillingStatusQuery` from the provider context.
 */
export const useEntitlement = (key: string): {
  has: boolean;
  isLoading: boolean;
  source: string | null;
} => {
  const { hooks } = useJBBilling();
  const statusQuery = hooks.useBillingStatusQuery();
  const match = useMemo(() => {
    const list = statusQuery.data?.entitlements?.user ?? [];
    return list.find((e) => e.key === key);
  }, [key, statusQuery.data]);
  return {
    has: Boolean(match),
    isLoading: statusQuery.isLoading,
    source: match?.source ?? null
  };
};

/**
 * Convenience for the canonical premium check.
 */
export const useIsPremium = (premiumKey = 'premium'): boolean => {
  const { has } = useEntitlement(premiumKey);
  return has;
};

export const useTrialInfo = (): BillingTrialInfo & { isLoading: boolean } => {
  const { hooks } = useJBBilling();
  const statusQuery = hooks.useBillingStatusQuery();
  return {
    days: statusQuery.data?.trial?.days ?? 0,
    eligible: statusQuery.data?.trial?.eligible ?? false,
    isLoading: statusQuery.isLoading
  };
};

export const usePaywall = () => {
  const { paywallVisible, paywallReason, triggerPaywall, dismissPaywall } = useJBBilling();
  return { visible: paywallVisible, reason: paywallReason, trigger: triggerPaywall, dismiss: dismissPaywall };
};
