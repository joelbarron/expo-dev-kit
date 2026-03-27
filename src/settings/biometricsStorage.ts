import AsyncStorage from '@react-native-async-storage/async-storage';

export const BIOMETRICS_ENABLED_KEY = 'biometric_enabled';
export const BIOMETRICS_PROMPT_DISMISSED_KEY = 'biometric_prompt_dismissed';
export const BIOMETRICS_LAST_UNLOCK_AT_KEY = 'biometric_last_unlock_at';

const normalizeUserId = (userId: unknown): string =>
  String(userId ?? '').trim();

const buildScopedKey = (baseKey: string, userId: unknown): string | null => {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) return null;
  return `${baseKey}:user:${normalizedUserId}`;
};

const parseBoolean = (raw: string | null): boolean => {
  if (typeof raw !== 'string') return false;
  return raw === '1' || raw.toLowerCase() === 'true';
};

const parseNumber = (raw: string | null): number | null => {
  if (typeof raw !== 'string') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getBiometricsEnabled = async (userId: unknown): Promise<boolean> => {
  const key = buildScopedKey(BIOMETRICS_ENABLED_KEY, userId);
  if (!key) return false;
  try {
    const raw = await AsyncStorage.getItem(key);
    return parseBoolean(raw);
  } catch {
    return false;
  }
};

export const setBiometricsEnabled = async (
  userId: unknown,
  enabled: boolean
): Promise<void> => {
  const key = buildScopedKey(BIOMETRICS_ENABLED_KEY, userId);
  if (!key) return;
  try {
    await AsyncStorage.setItem(key, enabled ? '1' : '0');
  } catch {
    // no-op
  }
};

export const getBiometricsPromptDismissed = async (
  userId: unknown
): Promise<boolean> => {
  const key = buildScopedKey(BIOMETRICS_PROMPT_DISMISSED_KEY, userId);
  if (!key) return false;
  try {
    const raw = await AsyncStorage.getItem(key);
    return parseBoolean(raw);
  } catch {
    return false;
  }
};

export const setBiometricsPromptDismissed = async (
  userId: unknown,
  dismissed: boolean
): Promise<void> => {
  const key = buildScopedKey(BIOMETRICS_PROMPT_DISMISSED_KEY, userId);
  if (!key) return;
  try {
    await AsyncStorage.setItem(key, dismissed ? '1' : '0');
  } catch {
    // no-op
  }
};

export const getBiometricsLastUnlockAt = async (
  userId: unknown
): Promise<number | null> => {
  const key = buildScopedKey(BIOMETRICS_LAST_UNLOCK_AT_KEY, userId);
  if (!key) return null;
  try {
    const raw = await AsyncStorage.getItem(key);
    return parseNumber(raw);
  } catch {
    return null;
  }
};

export const setBiometricsLastUnlockAt = async (
  userId: unknown,
  value: number | null
): Promise<void> => {
  const key = buildScopedKey(BIOMETRICS_LAST_UNLOCK_AT_KEY, userId);
  if (!key) return;
  try {
    if (value === null || !Number.isFinite(value)) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await AsyncStorage.setItem(key, String(value));
  } catch {
    // no-op
  }
};
