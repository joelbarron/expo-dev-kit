import { Platform } from 'react-native';

import type { BillingPlanEntitlement } from '../types';

/** Plataformas donde un entitlement puede ocultarse del paywall. */
export type PaywallPlatform = 'ios' | 'android' | 'web';

const normalize = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase());
  }

  if (typeof value === 'string') {
    return [value.trim().toLowerCase()];
  }

  return [];
};

/**
 * Un entitlement se oculta del paywall cuando `flags.hiddenInPaywall` incluye la
 * plataforma actual.
 *
 * El flag vive en `PlanEntitlement.flags` del backend y el catálogo ya lo expone
 * al cliente, así que se controla desde datos y sin recompilar la app.
 *
 *   flags: { "hiddenInPaywall": ["ios", "android"] }
 *
 * Va acotado por plataforma a propósito: un mismo plan puede vender un feature
 * en un cliente y no en otro — por ejemplo, algo que solo existe en la versión
 * web no debe anunciarse dentro de la app, pero sí en el paywall web.
 *
 * Acepta también `true` (ocultar en todas) y `"mobile"` (ios + android).
 */
export const isEntitlementHiddenInPaywall = (
  entitlement: Pick<BillingPlanEntitlement, 'flags'> | undefined,
  platform: PaywallPlatform = Platform.OS as PaywallPlatform,
): boolean => {
  const flag = entitlement?.flags?.hiddenInPaywall;

  if (flag === true) {
    return true;
  }

  const targets = normalize(flag);

  if (targets.length === 0) {
    return false;
  }

  const isMobile = platform === 'ios' || platform === 'android';

  return targets.includes(platform) || (isMobile && targets.includes('mobile'));
};

/** Entitlements que sí deben anunciarse en el paywall de esta plataforma. */
export const visiblePaywallEntitlements = <T extends Pick<BillingPlanEntitlement, 'flags'>>(
  entitlements: T[] | undefined,
  platform?: PaywallPlatform,
): T[] => (entitlements ?? []).filter((item) => !isEntitlementHiddenInPaywall(item, platform));
