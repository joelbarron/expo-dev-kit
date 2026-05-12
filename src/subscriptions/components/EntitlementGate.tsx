import React, { ReactNode } from 'react';

import { useEntitlement } from '../hooks';

export type EntitlementGateProps = {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional element while the status query is loading. Default: null. */
  loadingFallback?: ReactNode;
};

/**
 * Declarative gate: renders `children` only when the active session has
 * the requested entitlement. Otherwise renders `fallback` (or nothing).
 */
export const EntitlementGate: React.FC<EntitlementGateProps> = ({
  feature,
  children,
  fallback = null,
  loadingFallback = null
}) => {
  const { has, isLoading } = useEntitlement(feature);
  if (isLoading) return <>{loadingFallback}</>;
  if (!has) return <>{fallback}</>;
  return <>{children}</>;
};
