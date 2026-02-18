export type AppVersionInfo = {
  needsUpdate?: boolean;
  mandatoryUpdate?: boolean;
  url?: string;
  updateType?: string;
} & Record<string, unknown>;

export type AppStatusResponse = {
  underMaintenance?: boolean;
  requireUpdate?: boolean;
  forceUpdate?: boolean;
  minSupportedVersion?: string;
  latestVersion?: string;
  updateUrl?: string;
  maintenanceMessage?: string;
  message?: string;
} & Record<string, unknown>;

export type AppStatusState = {
  isLoading: boolean;
  isFetched: boolean;
  data: AppStatusResponse | null;
  updateInfo: AppVersionInfo | null;
  error: unknown;
  shouldBlock: boolean;
  blockingReason: 'maintenance' | 'update' | null;
};
