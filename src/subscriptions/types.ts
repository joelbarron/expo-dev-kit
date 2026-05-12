// Public types for the subscriptions module. Keep them aligned with the
// backend `jb-drf-billing` response shapes (camelCase).
//
// TODO[phase-4-stripe]: extend `JBBillingPurchaseChannels` and add
// `createCheckoutSession()` request/response types when the Stripe
// adapter ships. See jb-drf-billing/PHASE_4_TODO.md.

export type BillingPlatform = 'ios' | 'android';

export type BillingPlanPrice = {
  id: number;
  slug: string;
  interval: 'monthly' | 'yearly' | 'one_time';
  currency: string;
  countryCode?: string | null;
  amount: string;
  revenuecatProductId?: string | null;
  stripePriceId?: string | null;
};

export type BillingPlanEntitlement = {
  id: number;
  key: string;
  name: string;
  quota?: number | null;
  flags?: Record<string, unknown>;
};

export type BillingPlan = {
  id: number;
  slug: string;
  name: string;
  description?: string;
  tier?: string;
  prices: BillingPlanPrice[];
  entitlements: BillingPlanEntitlement[];
};

export type BillingPurchaseChannels = {
  ios?: string[];
  android?: string[];
  web?: string[];
};

export type BillingCatalogResponse = {
  appSlug: string | null;
  purchaseChannels: BillingPurchaseChannels;
  plans: BillingPlan[];
};

export type BillingSubscriptionSummary = {
  id: number;
  status: string;
  provider: string;
  planSlug: string;
  planPriceId: number | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  environment: string;
};

export type BillingEntitlementSummary = {
  key: string;
  name: string;
  source: string;
};

export type BillingProfileEntitlementSummary = {
  profileId: number;
  label?: string;
  entitlements: string[];
};

export type BillingTrialInfo = {
  days: number;
  eligible: boolean;
};

export type BillingStatusResponse = {
  appSlug: string | null;
  subscription: BillingSubscriptionSummary | null;
  entitlements: {
    user: BillingEntitlementSummary[];
    profiles: BillingProfileEntitlementSummary[];
  };
  purchaseChannels: BillingPurchaseChannels;
  trial: BillingTrialInfo;
};

export type BillingAccessCheckItem = {
  featureKey: string;
  enabled: boolean;
  reason: string | null;
  source: string | null;
  scopeType?: string;
};

export type BillingEntitlementGrant = {
  id: number;
  appSlug: string;
  scopeType: 'USER' | 'PROFILE';
  entitlement: { id: number; key: string; name: string };
  sourceType: string;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  priority: number;
};

export type BillingMobileSyncResponse = {
  ok: boolean;
  provider: string;
  synced: boolean;
  platform?: BillingPlatform | null;
  appUserId?: string | null;
  subscriptionsProcessed?: unknown[];
  subscriberFound?: boolean;
  message?: string;
};
