import { AppStatusResponse, AppVersionInfo } from './types';

export type ResolveAppStatusInput = {
  statusData: AppStatusResponse | null;
  updateInfo: AppVersionInfo | null;
};

export type ResolveAppStatusResult = {
  shouldBlock: boolean;
  blockingReason: 'maintenance' | 'update' | null;
  requireUpdate: boolean;
  underMaintenance: boolean;
};

export const resolveAppStatus = (input: ResolveAppStatusInput): ResolveAppStatusResult => {
  const underMaintenance = Boolean(input.statusData?.underMaintenance);

  const apiRequiresUpdate = Boolean(input.statusData?.requireUpdate || input.statusData?.forceUpdate);
  const checkerRequiresUpdate = Boolean(input.updateInfo?.needsUpdate || input.updateInfo?.mandatoryUpdate);
  const requireUpdate = apiRequiresUpdate || checkerRequiresUpdate;

  if (underMaintenance) {
    return {
      shouldBlock: true,
      blockingReason: 'maintenance',
      requireUpdate,
      underMaintenance
    };
  }

  if (requireUpdate) {
    return {
      shouldBlock: true,
      blockingReason: 'update',
      requireUpdate,
      underMaintenance
    };
  }

  return {
    shouldBlock: false,
    blockingReason: null,
    requireUpdate,
    underMaintenance
  };
};
