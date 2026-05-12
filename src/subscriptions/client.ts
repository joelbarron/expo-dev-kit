import { AxiosInstance } from 'axios';

import {
  BillingAccessCheckItem,
  BillingCatalogResponse,
  BillingEntitlementGrant,
  BillingMobileSyncResponse,
  BillingPlatform,
  BillingStatusResponse
} from './types';

const normalizeBasePath = (basePath?: string) => {
  const value = (basePath ?? '/billing').trim() || '/billing';
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.replace(/\/+$/, '');
};

export type BillingClientOptions = {
  axios: AxiosInstance;
  basePath?: string;
};

export class BillingClient {
  private readonly axios: AxiosInstance;
  public readonly basePath: string;

  constructor(options: BillingClientOptions) {
    this.axios = options.axios;
    this.basePath = normalizeBasePath(options.basePath);
  }

  async getCatalog(params?: {
    appSlug?: string;
    platform?: BillingPlatform;
    countryCode?: string;
    currency?: string;
  }): Promise<BillingCatalogResponse> {
    const response = await this.axios.get<BillingCatalogResponse>(`${this.basePath}/catalog`, {
      params
    });
    return response.data;
  }

  async getStatus(params?: { appSlug?: string }): Promise<BillingStatusResponse> {
    const response = await this.axios.get<BillingStatusResponse>(`${this.basePath}/status`, {
      params
    });
    return response.data;
  }

  async getEntitlements(params?: { appSlug?: string }): Promise<BillingEntitlementGrant[]> {
    const response = await this.axios.get<BillingEntitlementGrant[]>(
      `${this.basePath}/entitlements`,
      { params }
    );
    return response.data;
  }

  async checkAccess(payload: {
    features: string[];
    scopeType?: 'USER' | 'PROFILE';
    profileId?: number | null;
    appSlug?: string;
  }): Promise<BillingAccessCheckItem[]> {
    const response = await this.axios.post<BillingAccessCheckItem[]>(
      `${this.basePath}/access/check`,
      payload
    );
    return response.data;
  }

  async syncMobile(payload: {
    platform: BillingPlatform;
    appUserId: string;
  }): Promise<BillingMobileSyncResponse> {
    const response = await this.axios.post<BillingMobileSyncResponse>(
      `${this.basePath}/mobile/sync`,
      payload
    );
    return response.data;
  }

  async ackRestore(payload: {
    platform: BillingPlatform;
    appUserId: string;
  }): Promise<{ ok: boolean; acknowledged: boolean }> {
    const response = await this.axios.post<{ ok: boolean; acknowledged: boolean }>(
      `${this.basePath}/mobile/restore/ack`,
      payload
    );
    return response.data;
  }

  // TODO[phase-4-stripe]: implement createCheckoutSession/portalSession/changePlan
  // once the Stripe adapter ships. The backend endpoints already exist
  // (`/web/checkout-session`, `/web/portal-session`, `/web/change-plan`) but
  // return stub responses today.
  async createCheckoutSession(): Promise<never> {
    throw new Error(
      '[jb-drf-billing] Stripe checkout not implemented yet — Phase 4. See PHASE_4_TODO.md.'
    );
  }
}
