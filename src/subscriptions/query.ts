import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { BillingClient } from './client';
import {
  BillingCatalogResponse,
  BillingEntitlementGrant,
  BillingPlatform,
  BillingStatusResponse,
  BillingAccessCheckItem
} from './types';

export const billingQueryKeys = {
  all: ['billing'] as const,
  catalog: (appSlug?: string) => ['billing', 'catalog', appSlug ?? 'default'] as const,
  status: (appSlug?: string) => ['billing', 'status', appSlug ?? 'default'] as const,
  entitlements: (appSlug?: string) => ['billing', 'entitlements', appSlug ?? 'default'] as const,
  access: (features: string[]) =>
    ['billing', 'access', [...features].sort().join(',')] as const
};

const HOUR = 1000 * 60 * 60;
const THIRTY_SECONDS = 1000 * 30;

export const createBillingQueryHooks = (billingClient: BillingClient) => {
  const useBillingCatalogQuery = (opts?: { appSlug?: string; enabled?: boolean }) =>
    useQuery<BillingCatalogResponse>({
      queryKey: billingQueryKeys.catalog(opts?.appSlug),
      queryFn: () => billingClient.getCatalog({ appSlug: opts?.appSlug }),
      enabled: opts?.enabled ?? true,
      staleTime: HOUR
    });

  const useBillingStatusQuery = (opts?: { appSlug?: string; enabled?: boolean }) =>
    useQuery<BillingStatusResponse>({
      queryKey: billingQueryKeys.status(opts?.appSlug),
      queryFn: () => billingClient.getStatus({ appSlug: opts?.appSlug }),
      enabled: opts?.enabled ?? true,
      staleTime: THIRTY_SECONDS,
      refetchOnWindowFocus: true
    });

  const useBillingEntitlementsQuery = (opts?: { appSlug?: string; enabled?: boolean }) =>
    useQuery<BillingEntitlementGrant[]>({
      queryKey: billingQueryKeys.entitlements(opts?.appSlug),
      queryFn: () => billingClient.getEntitlements({ appSlug: opts?.appSlug }),
      enabled: opts?.enabled ?? true,
      staleTime: THIRTY_SECONDS
    });

  const useAccessCheckQuery = (
    features: string[],
    opts?: { scopeType?: 'USER' | 'PROFILE'; profileId?: number; enabled?: boolean }
  ) =>
    useQuery<BillingAccessCheckItem[]>({
      queryKey: billingQueryKeys.access(features),
      queryFn: () =>
        billingClient.checkAccess({
          features,
          scopeType: opts?.scopeType,
          profileId: opts?.profileId ?? null
        }),
      enabled: (opts?.enabled ?? true) && features.length > 0,
      staleTime: THIRTY_SECONDS
    });

  const useSyncMobileMutation = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (payload: { platform: BillingPlatform; appUserId: string }) =>
        billingClient.syncMobile(payload),
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: billingQueryKeys.all });
      }
    });
  };

  const useAckRestoreMutation = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (payload: { platform: BillingPlatform; appUserId: string }) =>
        billingClient.ackRestore(payload),
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: billingQueryKeys.all });
      }
    });
  };

  return {
    billingQueryKeys,
    useBillingCatalogQuery,
    useBillingStatusQuery,
    useBillingEntitlementsQuery,
    useAccessCheckQuery,
    useSyncMobileMutation,
    useAckRestoreMutation
  };
};

export type BillingQueryHooks = ReturnType<typeof createBillingQueryHooks>;
