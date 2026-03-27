import AsyncStorage from '@react-native-async-storage/async-storage';

export const PERMISSIONS_GUARD_NEXT_PROMPT_KEY =
  'permissions_guard_next_prompt_at';

type ReminderScope = {
  isAuthenticated: boolean;
  userId?: string | number | null;
  profileId?: string | number | null;
};

const normalizeSegment = (value: unknown, fallback: string) => {
  const next = String(value ?? '').trim();
  return next || fallback;
};

export const buildPermissionsGuardReminderKey = (scope: ReminderScope) => {
  if (!scope.isAuthenticated) {
    return `${PERMISSIONS_GUARD_NEXT_PROMPT_KEY}:guest`;
  }

  const userId = normalizeSegment(scope.userId, 'user');
  const profileId = normalizeSegment(scope.profileId, 'profile');
  return `${PERMISSIONS_GUARD_NEXT_PROMPT_KEY}:user:${userId}:profile:${profileId}`;
};

export const getPermissionsGuardNextPromptAt = async (key: string) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const setPermissionsGuardNextPromptAt = async (
  key: string,
  nextPromptAt: number
) => {
  try {
    await AsyncStorage.setItem(key, String(nextPromptAt));
  } catch {
    // no-op
  }
};

export const clearPermissionsGuardNextPromptAt = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
    // legacy cleanup
    await AsyncStorage.removeItem(PERMISSIONS_GUARD_NEXT_PROMPT_KEY);
  } catch {
    // no-op
  }
};
