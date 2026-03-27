import { useOfflineStore } from '../../runtime';

import { JBOfflineMutationCheckResult, JBOfflineMutationContext } from './types';

export class JBOfflineMutationError extends Error {
  public readonly code = 'OFFLINE_READ_ONLY_MUTATION_BLOCKED';

  constructor(message: string) {
    super(message);
  }
}

export const getOfflineMutationCheck = (
  context?: JBOfflineMutationContext
): JBOfflineMutationCheckResult => {
  const state = useOfflineStore.getState();
  const mode = state?.mode ?? 'blocking_with_offline';
  const isOffline = Boolean(state?.isOffline);
  const continueOffline = Boolean(state?.continueOffline);
  const actionLabel = context?.actionLabel?.trim();

  if (!isOffline) {
    return {
      allowed: true,
      mode,
      isOffline,
      continueOffline,
    };
  }

  const blockedByMode =
    mode === 'strict_blocking' || (mode === 'blocking_with_offline' && continueOffline);

  if (!blockedByMode) {
    return {
      allowed: true,
      mode,
      isOffline,
      continueOffline,
    };
  }

  const reason = actionLabel
    ? `No puedes ${actionLabel} sin conexión.`
    : 'No puedes realizar esta acción sin conexión.';

  return {
    allowed: false,
    reason,
    mode,
    isOffline,
    continueOffline,
  };
};

export const assertCanMutate = (context?: JBOfflineMutationContext) => {
  const check = getOfflineMutationCheck(context);
  if (check.allowed) {
    return;
  }

  throw new JBOfflineMutationError(check.reason ?? 'Acción bloqueada sin conexión.');
};
