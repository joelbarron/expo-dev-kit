import { AppStatusResponse, AppVersionInfo } from './types';

export type ResolveAppStatusInput = {
  statusData: AppStatusResponse | null;
  updateInfo: AppVersionInfo | null;
  strategy?: 'hybrid' | 'store' | 'remote';
  stage?: string;
  enforceUpdateInProductionOnly?: boolean;
  blockOnStoreMandatoryUpdate?: boolean;
  blockOnRemoteOutdated?: boolean;
  currentVersion?: string | null;
  fallbackUpdateUrl?: string;
  iosStoreUrl?: string;
  androidStoreUrl?: string;
  platform?: 'ios' | 'android' | 'web';
};

export type ResolveAppStatusResult = {
  shouldBlock: boolean;
  blockingReason: 'maintenance' | 'update' | null;
  requireUpdate: boolean;
  updateAvailable: boolean;
  updateUrl: string;
  detailMessage: string;
  underMaintenance: boolean;
};

const normalizeBoolean = (value: unknown): boolean =>
  value === true || value === 'true' || value === 'YES' || value === 'yes';

const normalizeString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const parseVersionPart = (value: string): number => {
  const clean = value.replace(/[^0-9]/g, '');
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : 0;
};

const compareVersions = (left: string, right: string): number => {
  const leftParts = left.split('.');
  const rightParts = right.split('.');
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = parseVersionPart(leftParts[index] ?? '0');
    const rightPart = parseVersionPart(rightParts[index] ?? '0');
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }

  return 0;
};

export const resolveAppStatus = (input: ResolveAppStatusInput): ResolveAppStatusResult => {
  const strategy = input.strategy ?? 'hybrid';
  const stage = normalizeString(input.stage).toUpperCase() || 'PRODUCTION';
  const shouldEnforceByStage = !input.enforceUpdateInProductionOnly || stage === 'PRODUCTION';
  const underMaintenance = normalizeBoolean(
    input.statusData?.underMaintenance ?? input.statusData?.under_maintenance
  );
  const remoteRequireUpdate = normalizeBoolean(
    input.statusData?.requireUpdate ??
      input.statusData?.require_update ??
      input.statusData?.forceUpdate ??
      input.statusData?.force_update
  );

  const latestVersion = normalizeString(
    input.statusData?.latestVersion ?? input.statusData?.latest_version
  );
  const currentVersion = normalizeString(input.currentVersion);
  const remoteOutdated =
    shouldEnforceByStage &&
    Boolean(input.blockOnRemoteOutdated) &&
    Boolean(latestVersion) &&
    Boolean(currentVersion) &&
    compareVersions(currentVersion, latestVersion) < 0;

  const checkerNeedsUpdate = normalizeBoolean(input.updateInfo?.needsUpdate);
  const checkerMandatoryUpdate = normalizeBoolean(input.updateInfo?.mandatoryUpdate);
  const checkerRequireUpdate =
    shouldEnforceByStage &&
    Boolean(input.blockOnStoreMandatoryUpdate) &&
    checkerMandatoryUpdate;

  const evaluateRemote =
    strategy === 'hybrid' || strategy === 'remote';
  const evaluateStore =
    strategy === 'hybrid' || strategy === 'store';

  const requireUpdate =
    (evaluateRemote && (remoteRequireUpdate || remoteOutdated)) ||
    (evaluateStore && checkerRequireUpdate);

  const updateAvailable =
    (evaluateStore && checkerNeedsUpdate) ||
    (evaluateRemote && (remoteRequireUpdate || remoteOutdated));

  const detailMessage = normalizeString(
    input.statusData?.outdatedMessage ??
      input.statusData?.outdated_message ??
      input.statusData?.maintenanceMessage ??
      input.statusData?.maintenance_message ??
      input.statusData?.message
  );
  const storeUrl = normalizeString(input.updateInfo?.url);
  const remoteUpdateUrl = normalizeString(
    input.statusData?.updateUrl ?? input.statusData?.update_url
  );
  const fallbackUpdateUrl = normalizeString(input.fallbackUpdateUrl);
  const platformUpdateUrl =
    input.platform === 'ios'
      ? normalizeString(input.iosStoreUrl)
      : input.platform === 'android'
      ? normalizeString(input.androidStoreUrl)
      : '';
  const updateUrl =
    storeUrl ||
    remoteUpdateUrl ||
    fallbackUpdateUrl ||
    platformUpdateUrl;

  if (underMaintenance) {
    return {
      shouldBlock: true,
      blockingReason: 'maintenance',
      requireUpdate,
      updateAvailable,
      updateUrl,
      detailMessage,
      underMaintenance
    };
  }

  if (requireUpdate) {
    return {
      shouldBlock: true,
      blockingReason: 'update',
      requireUpdate,
      updateAvailable,
      updateUrl,
      detailMessage,
      underMaintenance
    };
  }

  return {
    shouldBlock: false,
    blockingReason: null,
    requireUpdate,
    updateAvailable,
    updateUrl,
    detailMessage,
    underMaintenance
  };
};
