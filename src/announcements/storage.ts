import AsyncStorage from "@react-native-async-storage/async-storage";

import { JBAnnouncementsSeenMap } from "./types";

const ANNOUNCEMENTS_SEEN_KEY_PREFIX = "jb_announcements_seen";

export type JBAnnouncementsScopeInput = {
  isAuthenticated: boolean;
  userId?: string | number | null;
  profileId?: string | number | null;
};

const normalizeSegment = (value: unknown, fallback: string) => {
  const next = String(value ?? "").trim();
  return next || fallback;
};

export const buildJBAnnouncementsScope = (
  input: JBAnnouncementsScopeInput
): string => {
  if (!input.isAuthenticated) {
    return "guest";
  }
  const userId = normalizeSegment(input.userId, "user");
  const profileId = normalizeSegment(input.profileId, "profile");
  return `user:${userId}:profile:${profileId}`;
};

const buildStorageKey = (scope: string) =>
  `${ANNOUNCEMENTS_SEEN_KEY_PREFIX}:${scope}`;

export const buildAnnouncementVersionKey = (
  slug: string,
  version?: string | null,
  showOncePerVersion = true
) => {
  const normalizedSlug = String(slug ?? "").trim().toLowerCase();
  if (!normalizedSlug) return "";
  if (!showOncePerVersion) {
    return normalizedSlug;
  }
  const normalizedVersion = String(version ?? "").trim() || "1";
  return `${normalizedSlug}::${normalizedVersion}`;
};

export const getSeenAnnouncementsMap = async (
  scope: string
): Promise<JBAnnouncementsSeenMap> => {
  if (!scope) return {};
  try {
    const raw = await AsyncStorage.getItem(buildStorageKey(scope));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as JBAnnouncementsSeenMap;
  } catch {
    return {};
  }
};

export const markAnnouncementSeen = async (
  scope: string,
  announcementVersionKey: string
) => {
  if (!scope || !announcementVersionKey) return;
  const map = await getSeenAnnouncementsMap(scope);
  map[announcementVersionKey] = Date.now();
  try {
    await AsyncStorage.setItem(buildStorageKey(scope), JSON.stringify(map));
  } catch {
    // no-op
  }
};

export const markAnnouncementsSeenBulk = async (
  scope: string,
  announcementVersionKeys: string[]
) => {
  if (!scope || announcementVersionKeys.length === 0) return;
  const map = await getSeenAnnouncementsMap(scope);
  const now = Date.now();
  announcementVersionKeys.forEach((key) => {
    if (!key) return;
    map[key] = now;
  });
  try {
    await AsyncStorage.setItem(buildStorageKey(scope), JSON.stringify(map));
  } catch {
    // no-op
  }
};

