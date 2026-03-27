export type JBAppFeature = string;

type JBRoleMatrix = Partial<Record<string, JBAppFeature[]>>;

type JBFeatureConfig = {
  route?: string;
  paths?: string[];
};

type JBGuestNavigationConfig = {
  visibleTabs?: JBAppFeature[];
  blockedTabs?: JBAppFeature[];
  loginPath?: string;
};

export type JBNavigationAccessConfig = {
  features?: Partial<Record<JBAppFeature, JBFeatureConfig>>;
  roleMatrix?: JBRoleMatrix;
  guest?: JBGuestNavigationConfig;
};

type FeatureMeta = {
  feature: JBAppFeature;
  route: string;
  paths: string[];
};

const DEFAULT_FEATURE_ORDER: JBAppFeature[] = [
  "explore",
  "favorites",
  "reservations",
  "account",
];

const DEFAULT_ROLE_MATRIX: Record<string, JBAppFeature[]> = {
  GUEST: ["explore", "favorites", "reservations", "account"],
  HOST: ["explore", "reservations", "account"],
  STAFF: ["reservations", "account"],
  ADMIN: ["explore", "reservations", "account"],
};

const DEFAULT_GUEST_CONFIG: Required<JBGuestNavigationConfig> = {
  visibleTabs: ["explore", "favorites", "reservations", "account"],
  blockedTabs: ["favorites", "reservations", "account"],
  loginPath: "/welcome",
};

const DEFAULT_FEATURES: Record<JBAppFeature, JBFeatureConfig> = {
  explore: {
    route: "/",
    paths: [
      "/",
      "/explore/filters",
      "/listings/detail/:id",
      "/listings/description/:id",
      "/listings/cancellation-policy",
      "/listings/house-rules",
      "/listings/safety",
      "/listings/faqs",
      "/listings/report/:id",
      "/shared/profile-info/:id",
      "/shared/map-fullscreen",
    ],
  },
  favorites: {
    route: "/favorites",
    paths: ["/favorites", "/favorites/*"],
  },
  reservations: {
    route: "/reservations",
    paths: ["/reservations", "/reservations/*", "/listings/availability/:id", "/payments/*"],
  },
  account: {
    route: "/account",
    paths: ["/account", "/user/*", "/settings", "/notifications"],
  },
};

const normalizeRole = (value: unknown): string =>
  String(value ?? "GUEST").trim().toUpperCase() || "GUEST";

const normalizePath = (value: unknown): string => {
  const raw = String(value ?? "").split("?")[0].trim();
  if (!raw) return "/";
  const normalized = raw.replace(/\/+$/, "");
  return normalized || "/";
};

const normalizeFeatureList = (
  value: unknown,
  validFeatures: Set<string>,
): JBAppFeature[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter((item) => item.length > 0 && validFeatures.has(item));
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const patternToRegex = (pattern: string): RegExp => {
  const normalizedPattern = normalizePath(pattern);
  if (normalizedPattern === "/") {
    return /^\/$/;
  }

  const regexBody = normalizedPattern
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      if (segment === "*") return ".*";
      if (segment.startsWith(":")) return "[^/]+";
      if (segment.endsWith("*") && segment.length > 1) {
        const prefix = escapeRegex(segment.slice(0, -1));
        return `${prefix}.*`;
      }
      return escapeRegex(segment);
    })
    .join("/");

  return new RegExp(`^${regexBody}$`);
};

const matchPathPattern = (pathname: string, pattern: string): boolean => {
  const normalizedPath = normalizePath(pathname);
  const normalizedPattern = normalizePath(pattern);
  return patternToRegex(normalizedPattern).test(normalizedPath);
};

const getFeatureOrder = (
  featureMap: Record<JBAppFeature, JBFeatureConfig>,
): JBAppFeature[] => {
  const configuredFeatures = Object.keys(featureMap);
  const orderedDefaults = DEFAULT_FEATURE_ORDER.filter((feature) =>
    configuredFeatures.includes(feature),
  );
  const extraFeatures = configuredFeatures
    .filter((feature) => !orderedDefaults.includes(feature))
    .sort((left, right) => left.localeCompare(right));
  return [...orderedDefaults, ...extraFeatures];
};

const getFeatureMeta = (
  config?: JBNavigationAccessConfig | null,
): FeatureMeta[] => {
  const featureConfigMap = {
    ...DEFAULT_FEATURES,
    ...(config?.features ?? {}),
  };
  const order = getFeatureOrder(featureConfigMap);

  return order.map((feature) => {
    const featureConfig = featureConfigMap[feature] ?? {};
    const route =
      normalizePath(featureConfig.route) ||
      normalizePath(DEFAULT_FEATURES[feature]?.route) ||
      "/";
    const paths = Array.isArray(featureConfig.paths)
      ? featureConfig.paths
      : Array.isArray(DEFAULT_FEATURES[feature]?.paths)
        ? (DEFAULT_FEATURES[feature]?.paths as string[])
        : [route];

    const normalizedPaths = paths
      .map((path) => normalizePath(path))
      .filter((path, index, array) => array.indexOf(path) === index);

    if (!normalizedPaths.includes(route)) {
      normalizedPaths.unshift(route);
    }

    return {
      feature,
      route,
      paths: normalizedPaths,
    };
  });
};

const getFeaturesSet = (featureMeta: FeatureMeta[]): Set<string> =>
  new Set(featureMeta.map((item) => item.feature));

const getNavigationConfig = (
  config?: JBNavigationAccessConfig | null,
): Required<Pick<JBNavigationAccessConfig, "roleMatrix" | "guest">> => {
  const roleMatrix = {
    ...DEFAULT_ROLE_MATRIX,
    ...(config?.roleMatrix ?? {}),
  };

  const guest = {
    ...DEFAULT_GUEST_CONFIG,
    ...(config?.guest ?? {}),
  };

  return { roleMatrix, guest };
};

export const getAllowedFeaturesForSession = ({
  isAuthenticated,
  role,
  config,
}: {
  isAuthenticated: boolean;
  role?: string | null;
  config?: JBNavigationAccessConfig | null;
}): JBAppFeature[] => {
  const featureMeta = getFeatureMeta(config);
  const featuresSet = getFeaturesSet(featureMeta);
  const featureOrder = featureMeta.map((item) => item.feature);

  if (!isAuthenticated) {
    if (featuresSet.has("explore")) return ["explore"];
    return featureOrder.length > 0 ? [featureOrder[0]] : [];
  }

  const navigationConfig = getNavigationConfig(config);
  const normalizedRole = normalizeRole(role);
  const configured = normalizeFeatureList(
    navigationConfig.roleMatrix[normalizedRole],
    featuresSet,
  );
  if (configured.length > 0) {
    return configured;
  }

  const fallback = normalizeFeatureList(
    DEFAULT_ROLE_MATRIX.GUEST,
    featuresSet,
  );
  if (fallback.length > 0) {
    return fallback;
  }

  return featureOrder.length > 0 ? [featureOrder[0]] : [];
};

export const getVisibleTabsForSession = ({
  isAuthenticated,
  role,
  config,
}: {
  isAuthenticated: boolean;
  role?: string | null;
  config?: JBNavigationAccessConfig | null;
}): JBAppFeature[] => {
  const featureMeta = getFeatureMeta(config);
  const featuresSet = getFeaturesSet(featureMeta);

  if (!isAuthenticated) {
    const navigationConfig = getNavigationConfig(config);
    const configured = normalizeFeatureList(
      navigationConfig.guest.visibleTabs,
      featuresSet,
    );
    if (configured.length > 0) {
      return configured;
    }
    return normalizeFeatureList(DEFAULT_GUEST_CONFIG.visibleTabs, featuresSet);
  }
  return getAllowedFeaturesForSession({ isAuthenticated, role, config });
};

export const getGuestBlockedFeatures = (
  config?: JBNavigationAccessConfig | null,
): JBAppFeature[] => {
  const featureMeta = getFeatureMeta(config);
  const featuresSet = getFeaturesSet(featureMeta);
  const navigationConfig = getNavigationConfig(config);

  const configured = normalizeFeatureList(
    navigationConfig.guest.blockedTabs,
    featuresSet,
  );
  if (configured.length > 0) return configured;
  return normalizeFeatureList(DEFAULT_GUEST_CONFIG.blockedTabs, featuresSet);
};

export const getGuestLoginPath = (
  config?: JBNavigationAccessConfig | null,
): string => {
  const navigationConfig = getNavigationConfig(config);
  const raw = String(navigationConfig.guest.loginPath ?? "").trim();
  return raw || DEFAULT_GUEST_CONFIG.loginPath;
};

export const getDefaultRouteForFeatures = (
  features: JBAppFeature[],
  config?: JBNavigationAccessConfig | null,
): string => {
  const featureMeta = getFeatureMeta(config);
  const lookup = new Map(featureMeta.map((item) => [item.feature, item.route]));
  const featureOrder = featureMeta.map((item) => item.feature);
  const fallbackFeature = featureOrder.find((feature) => features.includes(feature));
  const chosenFeature =
    fallbackFeature ?? (featureOrder.includes("explore") ? "explore" : featureOrder[0]);

  return chosenFeature ? lookup.get(chosenFeature) ?? "/" : "/";
};

export const resolveFeatureFromPath = (
  pathname?: string | null,
  config?: JBNavigationAccessConfig | null,
): JBAppFeature | null => {
  const normalizedPath = normalizePath(pathname);
  const featureMeta = getFeatureMeta(config);

  for (const item of featureMeta) {
    if (item.paths.some((pattern) => matchPathPattern(normalizedPath, pattern))) {
      return item.feature;
    }
  }

  return null;
};
