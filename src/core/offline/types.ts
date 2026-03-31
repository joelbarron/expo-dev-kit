import { JBOfflineMode } from '../../config';

export type JBOfflineMutationContext = {
  actionLabel?: string;
};

export type JBOfflineMutationCheckResult = {
  allowed: boolean;
  reason?: string;
  mode: JBOfflineMode;
  isOffline: boolean;
  continueOffline: boolean;
};
