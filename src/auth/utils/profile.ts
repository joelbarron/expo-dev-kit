import { getApiBaseUrl, getLastCreatedJBExpoConfig } from '../../config';

type ProfileLike = Record<string, any> | null | undefined;

const pickText = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const ABSOLUTE_URI_REGEX = /^(https?:\/\/|file:\/\/|content:\/\/|data:)/i;

const appendCacheQuery = (uri: string, cacheKey?: string | number | null): string => {
  if (!cacheKey) return uri;
  if (uri.startsWith('data:')) return uri;
  const separator = uri.includes('?') ? '&' : '?';
  return `${uri}${separator}v=${encodeURIComponent(String(cacheKey))}`;
};

export const getProfilePictureRaw = (profile: ProfileLike): string => {
  if (!profile) return '';
  return (
    pickText(profile.picture) ||
    pickText(profile.pictureUrl) ||
    pickText(profile.picture_url) ||
    pickText(profile.avatar) ||
    pickText(profile.image) ||
    ''
  );
};

export const resolveProfilePictureUri = (
  uri: string | null | undefined,
  options?: { cacheKey?: string | number | null }
): string => {
  const rawUri = pickText(uri);
  if (!rawUri) return '';

  const withCache = appendCacheQuery(rawUri, options?.cacheKey);
  if (ABSOLUTE_URI_REGEX.test(withCache)) {
    return withCache;
  }

  const fallbackConfig = getLastCreatedJBExpoConfig();
  const apiBaseUrl = getApiBaseUrl(fallbackConfig);
  try {
    const origin = new URL(apiBaseUrl).origin;
    if (withCache.startsWith('//')) {
      return `https:${withCache}`;
    }
    if (withCache.startsWith('/')) {
      return `${origin}${withCache}`;
    }
    return `${origin}/${withCache.replace(/^\/+/, '')}`;
  } catch {
    return withCache;
  }
};

export const getProfilePictureUri = (
  profile: ProfileLike,
  options?: { cacheKey?: string | number | null }
): string => resolveProfilePictureUri(getProfilePictureRaw(profile), options);

export const getProfileFirstName = (profile: ProfileLike): string => {
  if (!profile) return '';
  return (
    pickText(profile.firstName) ||
    pickText(profile.first_name) ||
    pickText(profile.name) ||
    pickText(profile.username) ||
    ''
  );
};

export const getProfileFullName = (profile: ProfileLike): string => {
  if (!profile) return '';

  const first = getProfileFirstName(profile);
  const middle = pickText(profile.middleName) || pickText(profile.middle_name);
  const last1 =
    pickText(profile.lastName) ||
    pickText(profile.last_name) ||
    pickText(profile.lastName1) ||
    pickText(profile.last_name_1);
  const last2 = pickText(profile.lastName2) || pickText(profile.last_name_2);

  return [first, middle, last1, last2].filter(Boolean).join(' ').trim();
};

export const getProfileShortName = (profile: ProfileLike): string => {
  if (!profile) return '';
  const first = getProfileFirstName(profile);
  const last1 =
    pickText(profile.lastName) ||
    pickText(profile.last_name) ||
    pickText(profile.lastName1) ||
    pickText(profile.last_name_1) ||
    pickText(profile.lastName2) ||
    pickText(profile.last_name_2);

  return [first, last1].filter(Boolean).join(' ').trim();
};
