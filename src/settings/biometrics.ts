import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '../runtime';
import {
  getBiometricsEnabled,
  getBiometricsLastUnlockAt,
  getBiometricsPromptDismissed,
  setBiometricsEnabled,
  setBiometricsLastUnlockAt,
  setBiometricsPromptDismissed,
} from './biometricsStorage';

export type JBBiometricsPrimaryType =
  | 'face'
  | 'touch'
  | 'fingerprint'
  | 'iris'
  | 'biometric'
  | 'none';

export type JBBiometricsAvailability = {
  hasHardware: boolean;
  isEnrolled: boolean;
  isAvailable: boolean;
  supportedTypes: number[];
  primaryType: JBBiometricsPrimaryType;
  label: string;
};

export type JBBiometricsAuthenticateContext = 'enable' | 'unlock';

export type JBBiometricsAuthenticateOptions = {
  context?: JBBiometricsAuthenticateContext;
  label?: string;
  allowDeviceCredentialFallback?: boolean;
};

const toNumberArray = (value: unknown): number[] =>
  Array.isArray(value)
    ? value
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item))
    : [];

const resolvePrimaryType = (types: number[]): JBBiometricsPrimaryType => {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  if (types.length > 0) {
    return 'biometric';
  }
  return 'none';
};

export const resolveJBBiometricsLabel = (
  primaryType: JBBiometricsPrimaryType
): string => {
  if (primaryType === 'face') {
    return Platform.OS === 'ios' ? 'Face ID' : 'Reconocimiento facial';
  }
  if (primaryType === 'touch') {
    return 'Touch ID';
  }
  if (primaryType === 'fingerprint') {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Huella';
  }
  if (primaryType === 'iris') {
    return 'Biometría';
  }
  return 'Biometría';
};

export const getJBBiometricsAvailability =
  async (): Promise<JBBiometricsAvailability> => {
    const [hasHardware, isEnrolled, supportedTypesRaw] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    const supportedTypes = toNumberArray(supportedTypesRaw);
    const primaryType = resolvePrimaryType(supportedTypes);
    const effectivePrimaryType =
      primaryType === 'fingerprint' && Platform.OS === 'ios'
        ? 'touch'
        : primaryType;

    return {
      hasHardware,
      isEnrolled,
      isAvailable: hasHardware && isEnrolled,
      supportedTypes,
      primaryType: effectivePrimaryType,
      label: resolveJBBiometricsLabel(effectivePrimaryType),
    };
  };

export const isJBBiometricsAvailable = (
  availability: JBBiometricsAvailability | null | undefined
) => Boolean(availability?.hasHardware && availability?.isEnrolled);

export const authenticateJBBiometrics = async ({
  context = 'unlock',
  label = 'Biometría',
  allowDeviceCredentialFallback = true,
}: JBBiometricsAuthenticateOptions = {}) => {
  const promptMessage =
    context === 'enable'
      ? `Confirma para activar ${label}`
      : `Desbloquea con ${label}`;

  return LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    disableDeviceFallback: !allowDeviceCredentialFallback,
  });
};

const resolveUserId = (value: unknown): string => String(value ?? '').trim();

export const useJBBiometricsState = () => {
  const userId = useAuthStore(
    (state: any) => state?.user?.id ?? state?.user?.pk ?? null
  );
  const normalizedUserId = useMemo(() => resolveUserId(userId), [userId]);

  const [availability, setAvailability] =
    useState<JBBiometricsAvailability | null>(null);
  const [isAvailabilityLoaded, setIsAvailabilityLoaded] = useState(false);
  const [isEnabled, setIsEnabledState] = useState(false);
  const [isPromptDismissed, setIsPromptDismissedState] = useState(false);
  const [lastUnlockAt, setLastUnlockAtState] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshAvailability = useCallback(async () => {
    try {
      const nextAvailability = await getJBBiometricsAvailability();
      setAvailability(nextAvailability);
    } catch {
      setAvailability({
        hasHardware: false,
        isEnrolled: false,
        isAvailable: false,
        supportedTypes: [],
        primaryType: 'none',
        label: 'Biometría',
      });
    } finally {
      setIsAvailabilityLoaded(true);
    }
  }, []);

  const reload = useCallback(async () => {
    if (!normalizedUserId) {
      setIsEnabledState(false);
      setIsPromptDismissedState(false);
      setLastUnlockAtState(null);
      setIsLoaded(true);
      await refreshAvailability();
      return;
    }

    const [enabled, dismissed, unlockedAt] = await Promise.all([
      getBiometricsEnabled(normalizedUserId),
      getBiometricsPromptDismissed(normalizedUserId),
      getBiometricsLastUnlockAt(normalizedUserId),
      refreshAvailability(),
    ]);

    setIsEnabledState(enabled);
    setIsPromptDismissedState(dismissed);
    setLastUnlockAtState(unlockedAt);
    setIsLoaded(true);
  }, [normalizedUserId, refreshAvailability]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoaded(false);
      await reload();
      if (cancelled) return;
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  const setEnabled = useCallback(
    async (value: boolean) => {
      setIsEnabledState(value);
      if (!normalizedUserId) return;
      await setBiometricsEnabled(normalizedUserId, value);
      if (!value) {
        await setBiometricsLastUnlockAt(normalizedUserId, null);
        setLastUnlockAtState(null);
      }
    },
    [normalizedUserId]
  );

  const setPromptDismissed = useCallback(
    async (value: boolean) => {
      setIsPromptDismissedState(value);
      if (!normalizedUserId) return;
      await setBiometricsPromptDismissed(normalizedUserId, value);
    },
    [normalizedUserId]
  );

  const markUnlockedNow = useCallback(async () => {
    const now = Date.now();
    setLastUnlockAtState(now);
    if (!normalizedUserId) return;
    await setBiometricsLastUnlockAt(normalizedUserId, now);
  }, [normalizedUserId]);

  return {
    userId: normalizedUserId || null,
    availability,
    isAvailabilityLoaded,
    isAvailable: isJBBiometricsAvailable(availability),
    isEnabled,
    isPromptDismissed,
    lastUnlockAt,
    isLoaded,
    refreshAvailability,
    reload,
    setEnabled,
    setPromptDismissed,
    markUnlockedNow,
    authenticate: authenticateJBBiometrics,
  };
};
