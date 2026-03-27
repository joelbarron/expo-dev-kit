export type AppVersionInfo = {
  needsUpdate?: boolean;
  mandatoryUpdate?: boolean;
  url?: string;
  updateType?: string;
  version?: string;
} & Record<string, unknown>;

export type AppStatusResponse = {
  underMaintenance?: boolean;
  under_maintenance?: boolean;
  requireUpdate?: boolean;
  require_update?: boolean;
  forceUpdate?: boolean;
  force_update?: boolean;
  minSupportedVersion?: string;
  min_supported_version?: string;
  latestVersion?: string;
  latest_version?: string;
  updateUrl?: string;
  update_url?: string;
  maintenanceMessage?: string;
  maintenance_message?: string;
  outdatedMessage?: string;
  outdated_message?: string;
  message?: string;
} & Record<string, unknown>;

export type AppStatusState = {
  isLoading: boolean;
  isFetched: boolean;
  data: AppStatusResponse | null;
  updateInfo: AppVersionInfo | null;
  error: unknown;
  shouldBlock: boolean;
  updateAvailable: boolean;
  updateUrl: string;
  detailMessage?: string;
  blockingReason: 'maintenance' | 'update' | null;
};
