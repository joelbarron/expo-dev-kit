/**
 * Build the canonical RevenueCat `app_user_id`.
 *
 * Format: `${appSlug}:user:${userId}`. The backend looks this up to match
 * webhook events back to a user. **Never use anonymous** — only configure
 * Purchases after authentication.
 */
export const buildAppUserId = (
  appSlug: string,
  userId: string | number | null | undefined
): string | null => {
  if (!appSlug || userId == null) return null;
  const slug = String(appSlug).trim();
  const id = String(userId).trim();
  if (!slug || !id) return null;
  return `${slug}:user:${id}`;
};

export const parseAppUserId = (
  appUserId: string | null | undefined
): { appSlug: string; userId: string } | null => {
  if (!appUserId) return null;
  const parts = appUserId.split(':');
  if (parts.length < 3 || parts[parts.length - 2] !== 'user') return null;
  return {
    appSlug: parts.slice(0, -2).join(':'),
    userId: parts[parts.length - 1]
  };
};
