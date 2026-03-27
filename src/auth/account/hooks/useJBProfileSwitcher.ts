import { useCallback, useMemo } from "react";

import { getProfilePictureUri } from "../../utils";
import { useJBProfiles } from "./useJBProfiles";
import { useJBUserAccountCapabilities } from "./useJBUserAccountCapabilities";

const normalizeRole = (value: unknown): string =>
  String(value ?? "").trim().toUpperCase();

const normalizeMirrorPairs = (
  rawPairs: unknown,
): Array<[string, string]> => {
  if (!Array.isArray(rawPairs)) {
    return [["HOST", "GUEST"]];
  }

  const parsedPairs = rawPairs
    .map((pair) => {
      if (!Array.isArray(pair) || pair.length < 2) return null;
      const left = normalizeRole(pair[0]);
      const right = normalizeRole(pair[1]);
      if (!left || !right) return null;
      return [left, right] as [string, string];
    })
    .filter((pair): pair is [string, string] => Boolean(pair));

  if (parsedPairs.length === 0) {
    return [["HOST", "GUEST"]];
  }

  return parsedPairs;
};

const getProfileId = (profile: Record<string, any>): string =>
  String(profile?.id ?? profile?.pk ?? "");

const normalizeRoutePath = (value: unknown, fallback = "/"): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("/")) return raw;
  return `/${raw.replace(/^\/+/, "")}`;
};

type ProfileSwitcherProfile = Record<string, any> & {
  __profile_id?: string;
  __picture_uri?: string;
};

export const useJBProfileSwitcher = () => {
  const capabilities = useJBUserAccountCapabilities();
  const {
    profiles,
    activeProfile,
    isLoadingProfiles,
    isSwitchingProfileId,
    refreshProfiles,
    switchProfile: mutateSwitchProfile,
  } = useJBProfiles();

  const isProfileMirrorEnabled = Boolean(
    capabilities.accountConfig.profileMirror?.enabled,
  );
  const mirrorPairs = useMemo(
    () =>
      normalizeMirrorPairs(capabilities.accountConfig.profileMirror?.rolePairs),
    [capabilities.accountConfig.profileMirror?.rolePairs],
  );

  const switchableProfiles = useMemo<ProfileSwitcherProfile[]>(() => {
    const baseProfiles = Array.isArray(profiles)
      ? profiles.filter((profile) => profile && typeof profile === "object")
      : [];

    if (baseProfiles.length === 0) {
      return [];
    }

    if (!isProfileMirrorEnabled) {
      return baseProfiles.map((profile) => ({
        ...profile,
        __profile_id: getProfileId(profile),
        __picture_uri: getProfilePictureUri(profile),
      }));
    }

    const allowedRoles = new Set<string>();
    mirrorPairs.forEach(([left, right]) => {
      allowedRoles.add(left);
      allowedRoles.add(right);
    });

    const mirrorProfiles = baseProfiles.filter((profile) =>
      allowedRoles.has(normalizeRole(profile?.role ?? profile?.role_value)),
    );

    const effectiveProfiles =
      mirrorProfiles.length >= 2 ? mirrorProfiles : baseProfiles;

    return effectiveProfiles.map((profile) => ({
      ...profile,
      __profile_id: getProfileId(profile),
      __picture_uri: getProfilePictureUri(profile),
    }));
  }, [isProfileMirrorEnabled, mirrorPairs, profiles]);

  const canCreateProfile = Boolean(capabilities.canCreateProfile);
  const hasSwitchCapability = Boolean(
    capabilities.config.enabled &&
      capabilities.config.screens?.profiles?.enabled &&
      capabilities.config.screens?.profiles?.allowSwitch,
  );
  const canSwitchProfiles = useMemo(() => {
    if (!hasSwitchCapability) return false;
    if (switchableProfiles.length <= 1) return false;
    if (capabilities.canSwitchProfiles) return true;
    return isProfileMirrorEnabled;
  }, [
    capabilities.canSwitchProfiles,
    hasSwitchCapability,
    isProfileMirrorEnabled,
    switchableProfiles.length,
  ]);

  // Allow opening the sheet when switch is enabled even before profiles are refreshed.
  const isEnabled = hasSwitchCapability || canCreateProfile;
  const homePathAfterProfileSwitch = normalizeRoutePath(
    capabilities.config.routing.homePathAfterProfileSwitch,
    "/",
  );

  const switchToProfile = useCallback(
    async (profileId: string | number) => {
      const targetId = String(profileId);
      const activeId = activeProfile ? getProfileId(activeProfile as any) : "";
      if (!targetId || (activeId && activeId === targetId)) {
        return false;
      }

      await mutateSwitchProfile(targetId);
      await refreshProfiles().catch(() => undefined);
      return true;
    },
    [activeProfile, mutateSwitchProfile, refreshProfiles],
  );

  return {
    profiles: switchableProfiles,
    activeProfile: (activeProfile as Record<string, any> | null) ?? null,
    isLoadingProfiles,
    isSwitchingProfileId,
    canCreateProfile,
    hasSwitchCapability,
    canSwitchProfiles,
    isEnabled,
    isProfileMirrorEnabled,
    homePathAfterProfileSwitch,
    refreshProfiles,
    switchToProfile,
  };
};
