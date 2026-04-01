import { useJBAuth } from "../auth";
import {
  getLastCreatedJBExpoConfig,
  getPermissionsConfig,
  getRuntimeAnnouncementsConfig,
  getSettingsRoutesConfig,
  JBAppConfig,
} from "../config";
import { useAppConfigStore, useAuthStore } from "../runtime";
import { getJBPermissionStatus } from "../settings";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";

import {
  buildAnnouncementVersionKey,
  buildJBAnnouncementsScope,
  getSeenAnnouncementsMap,
} from "./storage";
import { JBAnnouncementsService } from "./service";
import { JBAnnouncementCampaign } from "./types";

const normalizePathname = (path?: string | null): string => {
  if (!path) return "/";
  const withoutQuery = path.split("?")[0] ?? "/";
  const normalized = withoutQuery.trim();
  if (!normalized) return "/";
  const cleaned = normalized.replace(/\/+$/, "") || "/";
  const segments = cleaned
    .split("/")
    .filter(Boolean)
    // Ignore expo-router route groups like (auth), (app), (tabs).
    .filter((segment) => !/^\(.+\)$/.test(segment));
  if (segments.length === 0) return "/";

  const indexRemoved =
    segments[segments.length - 1] === "index" ? segments.slice(0, -1) : segments;
  return indexRemoved.length ? `/${indexRemoved.join("/")}` : "/";
};

const isSameOrDescendantPath = (currentPath: string, basePath: string) => {
  const current = normalizePathname(currentPath);
  const base = normalizePathname(basePath);
  if (base === "/") return current === "/";
  return current === base || current.startsWith(`${base}/`);
};

const normalizeRoutePath = (value: unknown, fallback: string) => {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("/")) return raw;
  return `/${raw.replace(/^\/+/, "")}`;
};

type OpenAnnouncementsParams = {
  routePath: string;
  campaignSlug?: string;
  autoOpen?: boolean;
};

export const buildAnnouncementsRoutePath = ({
  routePath,
  campaignSlug,
  autoOpen = false,
}: OpenAnnouncementsParams): string => {
  const normalizedRoute = normalizeRoutePath(routePath, "/announcements");
  const params = new URLSearchParams();
  if (campaignSlug) {
    params.set("campaign", campaignSlug);
  }
  if (autoOpen) {
    params.set("autoOpen", "1");
  }
  const query = params.toString();
  return query ? `${normalizedRoute}?${query}` : normalizedRoute;
};

export const openAnnouncements = (
  router: { push: (value: any) => void },
  params: OpenAnnouncementsParams
) => {
  const nextPath = buildAnnouncementsRoutePath(params);
  router.push(nextPath as any);
};

export const useOpenAnnouncements = () => {
  const router = useRouter();
  const baseConfig = getLastCreatedJBExpoConfig();
  const remoteConfig = useAppConfigStore((state: any) => state?.appConfig);

  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        runtime: {
          ...(baseConfig.runtime ?? {}),
          ...(remoteConfig?.runtime ?? {}),
        },
      } as JBAppConfig),
    [baseConfig, remoteConfig?.runtime]
  );
  const announcementsConfig = useMemo(
    () => getRuntimeAnnouncementsConfig(mergedConfig),
    [mergedConfig]
  );
  const routePath = normalizeRoutePath(
    announcementsConfig?.routePath,
    "/announcements"
  );

  return useCallback(
    (campaignSlug?: string) => {
      openAnnouncements(router, {
        routePath,
        campaignSlug,
      });
    },
    [routePath, router]
  );
};

const pickNextAutoOpenCampaign = async (
  campaigns: JBAnnouncementCampaign[],
  scope: string
) => {
  const seenMap = await getSeenAnnouncementsMap(scope);
  for (const campaign of campaigns) {
    if (!campaign?.auto_open) continue;
    const announcementKey = buildAnnouncementVersionKey(
      campaign.slug,
      campaign.version,
      campaign.show_once_per_version !== false
    );
    if (!announcementKey) continue;
    if (!seenMap[announcementKey]) {
      return campaign;
    }
  }
  return null;
};

type JBAnnouncementsGuardOptions = {
  gateNavigationLockRef?: MutableRefObject<boolean>;
  blockAutoOpen?: boolean;
};

export const useJBAnnouncementsGuard = (
  options: JBAnnouncementsGuardOptions = {}
) => {
  const gateNavigationLockRef = options.gateNavigationLockRef;
  const blockAutoOpen = options.blockAutoOpen === true;
  const router = useRouter();
  const pathname = usePathname();
  const { authStatus, isAuthenticated } = useJBAuth();
  const activeProfileId = useAuthStore(
    (state: any) => state?.activeProfile?.id ?? state?.defaultProfile?.id ?? null
  );
  const authUserId = useAuthStore(
    (state: any) => state?.user?.id ?? state?.user?.pk ?? null
  );
  const baseConfig = getLastCreatedJBExpoConfig();
  const remoteConfig = useAppConfigStore((state: any) => state?.appConfig);
  const [activeTick, setActiveTick] = useState(0);
  const isNavigatingRef = useRef(false);
  const lastOpenAtRef = useRef(0);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        setActiveTick((prev) => prev + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        runtime: {
          ...(baseConfig.runtime ?? {}),
          ...(remoteConfig?.runtime ?? {}),
        },
        permissions: {
          ...(baseConfig.permissions ?? {}),
          ...(remoteConfig?.permissions ?? {}),
        },
        settings: {
          ...(baseConfig.settings ?? {}),
          ...(remoteConfig?.settings ?? {}),
        },
      } as JBAppConfig),
    [
      baseConfig,
      remoteConfig?.permissions,
      remoteConfig?.runtime,
      remoteConfig?.settings,
    ]
  );
  const announcementsConfig = useMemo(
    () => getRuntimeAnnouncementsConfig(mergedConfig),
    [mergedConfig]
  );
  const permissionsConfig = useMemo(
    () => getPermissionsConfig(mergedConfig),
    [mergedConfig]
  );
  const settingsRoutes = useMemo(
    () => getSettingsRoutesConfig(mergedConfig),
    [mergedConfig]
  );

  const guardEnabled = announcementsConfig?.enabled === true;
  const autoOpenMode = String(
    announcementsConfig?.autoOpenMode ?? "first_install_and_new_campaign"
  ).trim();
  const endpointPath = String(
    announcementsConfig?.endpointPath ?? "/core/mobile-announcements/"
  ).trim();
  const routePath = normalizeRoutePath(
    announcementsConfig?.routePath,
    "/announcements"
  );
  const landingPath = normalizeRoutePath(
    isAuthenticated
      ? announcementsConfig?.openAfterRoutes?.authenticated ?? "/"
      : announcementsConfig?.openAfterRoutes?.guest ?? "/welcome",
    isAuthenticated ? "/" : "/welcome"
  );
  const landingCandidates = useMemo(
    () => {
      const candidates = new Set<string>();
      candidates.add(normalizePathname(landingPath));
      if (isAuthenticated) {
        candidates.add("/");
      } else {
        candidates.add("/welcome");
        candidates.add("/");
      }
      return Array.from(candidates);
    },
    [isAuthenticated, landingPath]
  );
  const permissionsPath = normalizeRoutePath(
    permissionsConfig.guard?.setupPath ?? settingsRoutes.permissions,
    settingsRoutes.permissions
  );
  const scope = useMemo(
    () =>
      buildJBAnnouncementsScope({
        isAuthenticated,
        userId: authUserId,
        profileId: activeProfileId,
      }),
    [activeProfileId, authUserId, isAuthenticated]
  );

  useEffect(() => {
    if (blockAutoOpen) return;
    if (!guardEnabled) return;
    if (autoOpenMode !== "first_install_and_new_campaign") return;
    if (authStatus === "configuring") return;
    if (gateNavigationLockRef?.current) return;
    if (isNavigatingRef.current) return;

    const now = Date.now();
    if (now - lastOpenAtRef.current < 1200) {
      return;
    }

    const isOnLanding = landingCandidates.some((candidate) =>
      isSameOrDescendantPath(pathname, candidate)
    );
    if (!isOnLanding) return;
    if (isSameOrDescendantPath(pathname, routePath)) return;
    if (isSameOrDescendantPath(pathname, permissionsPath)) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const requiredPermissions = Array.isArray(permissionsConfig.required)
        ? permissionsConfig.required
        : [];
      if (requiredPermissions.length > 0) {
        const statuses = await Promise.all(
          requiredPermissions.map(async (permission) => {
            const status = await getJBPermissionStatus(permission as any);
            return status;
          })
        );
        if (cancelled) return;
        if (statuses.some((status) => status !== "granted")) {
          return;
        }
      }

      const campaigns = await JBAnnouncementsService.fetchActive({
        endpointPath,
        platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "all",
        preferAuthenticatedClient: isAuthenticated,
      });
      if (cancelled) return;
      if (!Array.isArray(campaigns) || campaigns.length === 0) return;

      const sortedCampaigns = campaigns
        .filter((campaign) => Array.isArray(campaign.slides) && campaign.slides.length > 0)
        .sort((a, b) => {
          const priorityDiff = Number(b.priority || 0) - Number(a.priority || 0);
          if (priorityDiff !== 0) return priorityDiff;
          return String(a.slug || "").localeCompare(String(b.slug || ""));
        });

      const nextCampaign = await pickNextAutoOpenCampaign(sortedCampaigns, scope);
      if (cancelled || !nextCampaign) return;
      if (gateNavigationLockRef?.current) return;

      isNavigatingRef.current = true;
      if (gateNavigationLockRef) {
        gateNavigationLockRef.current = true;
      }
      lastOpenAtRef.current = Date.now();
      openAnnouncements(router as any, {
        routePath,
        campaignSlug: nextCampaign.slug,
        autoOpen: true,
      });
      setTimeout(() => {
        isNavigatingRef.current = false;
        if (gateNavigationLockRef) {
          gateNavigationLockRef.current = false;
        }
      }, 500);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    activeTick,
    authStatus,
    autoOpenMode,
    blockAutoOpen,
    endpointPath,
    gateNavigationLockRef,
    guardEnabled,
    isAuthenticated,
    landingCandidates,
    pathname,
    permissionsConfig.required,
    permissionsPath,
    routePath,
    router,
    scope,
  ]);
};

export const useAnnouncementRouteParams = () => {
  const params = useLocalSearchParams<{
    campaign?: string;
    autoOpen?: string;
  }>();
  const campaign = String(params?.campaign ?? "").trim();
  const autoOpen = String(params?.autoOpen ?? "").trim() === "1";
  return {
    campaign: campaign || null,
    autoOpen,
  };
};
