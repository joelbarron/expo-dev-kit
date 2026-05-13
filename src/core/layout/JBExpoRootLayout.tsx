import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import { Stack, usePathname, useRouter } from "expo-router";
import * as Application from "expo-application";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar, StatusBarStyle } from "expo-status-bar";
import moment from "moment";
import "moment/locale/es";
import "moment/locale/es-mx";
import NetInfo from "@react-native-community/netinfo";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  AppState,
  Image,
  Platform,
  Text as RNText,
  View,
} from "react-native";

import {
  JBAuthProvider,
  JBAuthStatus,
  useJBAuth,
  useJBProfileCompletion,
} from "../../auth";
import {
  getAuthAccountConfig,
  getAuthAccountScreensConfig,
  getAuthRoutesConfig,
  getLastCreatedJBExpoConfig,
  JBAppConfig,
  JBAppStage,
  JBAppStageLowercase,
  getPermissionsConfig,
  getRuntimeAppStatusConfig,
  getRuntimeLoadingConfig,
  getRuntimeOfflineConfig,
  getSettingsConfig,
  getSettingsRoutesConfig,
  JBStripeConfig,
  JBStripePublishableKeyConfig,
  JBUIConfig,
  resolveJBUIColor,
} from "../../config";
import { useColorScheme } from "../../hooks";
import { useAppConfigStore, useAuthStore, useOfflineStore } from "../../runtime";
import {
  buildPermissionsGuardReminderKey,
  clearPermissionsGuardNextPromptAt,
  getJBPermissionStatus,
  getPermissionsGuardNextPromptAt,
  isJBBiometricsAvailable,
  useJBBiometricsState,
} from "../../settings";
import { useJBAnnouncementsGuard } from "../../announcements";
import { customAxiosAuthenticated } from "../../http";
import { ConfirmationDialog } from "../../shared";
import { getColor } from "../../utils";
import { loginDeviceInfo } from "../../utils/device-info";
import { JBFormButton } from "../../forms";
import {
  JBRequireUpdateScreen,
  JBUnderMaintenanceScreen,
  resolveAppStatus,
} from "../app-status";
import { JBOfflineGateScreen } from "../offline";
import {
  JBExpoAppProviders,
  JBExpoAppProvidersProps,
} from "./JBExpoAppProviders";

type StripeProviderProps = {
  publishableKey: string;
  merchantIdentifier?: string;
  urlScheme?: string;
  setReturnUrlSchemeOnAndroid?: boolean;
  children?: React.ReactNode;
};

type StripeProviderComponentType = React.ComponentType<StripeProviderProps>;

type JBExpoRootLayoutProps = {
  authClient: any;
  appMeta?: JBExpoAppProvidersProps["appMeta"];
  colorMode?: JBExpoAppProvidersProps["colorMode"];
  uiConfig?: JBUIConfig;
  withStatusBar?: boolean;
  statusBarStyle?: StatusBarStyle;
  stripeConfig?: JBStripeConfig;
  unauthenticatedInitialRouteGroup?: "(app)" | "(auth)";
  manageNativeSplash?: boolean;
  onAuthStateChanged?: (state: {
    authStatus: JBAuthStatus;
    isAuthenticated: boolean;
    user: unknown | null;
  }) => void;
  underMaintenanceFallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
} & Omit<
  JBExpoAppProvidersProps,
  "children" | "colorMode" | "appMeta" | "navigationTheme"
>;

const resolveStripePublishableKeyByStage = (
  publishableKey: JBStripePublishableKeyConfig | undefined,
  stage: JBAppStage,
): string => {
  if (!publishableKey) return "";
  if (typeof publishableKey === "string") {
    return publishableKey.trim();
  }

  const stageUpper = stage;
  const stageLower = stage.toLowerCase() as JBAppStageLowercase;
  const resolvedKey =
    publishableKey[stageUpper] ??
    publishableKey[stageLower] ??
    publishableKey.QA ??
    publishableKey.qa ??
    publishableKey.DEVELOPMENT ??
    publishableKey.development ??
    publishableKey.LOCAL ??
    publishableKey.local ??
    publishableKey.PRODUCTION ??
    publishableKey.production;

  return String(resolvedKey ?? "").trim();
};

const resolveStripeRuntimeConfig = (
  baseConfig: JBAppConfig,
  stripeOverrides?: JBStripeConfig,
) => {
  const fromBase = baseConfig?.stripe;
  const enabled = Boolean(
    stripeOverrides?.enabled ??
      stripeOverrides?.useStripe ??
      fromBase?.enabled ??
      fromBase?.useStripe,
  );

  const envKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const stage = (baseConfig?.stage ?? "LOCAL") as JBAppStage;
  const publishableKey =
    envKey ||
    resolveStripePublishableKeyByStage(
      stripeOverrides?.publishableKey ?? fromBase?.publishableKey,
      stage,
    );

  return {
    enabled,
    publishableKey,
    merchantIdentifier:
      stripeOverrides?.merchantIdentifier ?? fromBase?.merchantIdentifier,
    urlScheme: stripeOverrides?.urlScheme ?? fromBase?.urlScheme,
    setReturnUrlSchemeOnAndroid:
      stripeOverrides?.setReturnUrlSchemeOnAndroid ??
      fromBase?.setReturnUrlSchemeOnAndroid,
  };
};

const getOptionalStripeProvider = (): StripeProviderComponentType | null => {
  try {
    const stripeModule = require("@stripe/stripe-react-native");
    return (stripeModule?.StripeProvider ??
      null) as StripeProviderComponentType | null;
  } catch {
    return null;
  }
};

const resolveNavigationTheme = (
  mode: "light" | "dark",
  uiConfig?: JBUIConfig,
): Theme => {
  const primaryColor = getColor("primary");
  const backgroundColor = getColor("background");
  const typographyColor = getColor("typography");
  const mutedColor = getColor("muted");
  const redColor = getColor("red");
  const defaultBackgroundColor =
    mode === "dark"
      ? backgroundColor[0] ?? "#070b10"
      : backgroundColor.light ?? "#f8f9fa";
  const defaultCardColor =
    mode === "dark"
      ? backgroundColor[200] ?? "#121b26"
      : backgroundColor[50] ?? "#ffffff";

  const resolvedBackgroundColor = resolveJBUIColor(
    uiConfig?.main?.backgroundColor,
    mode,
    defaultBackgroundColor,
  );
  const resolvedCardColor = resolveJBUIColor(
    uiConfig?.card?.backgroundColor,
    mode,
    defaultCardColor,
  );

  if (mode === "dark") {
    return {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: primaryColor[500],
        background: resolvedBackgroundColor ?? backgroundColor[0],
        card: resolvedCardColor ?? backgroundColor[200],
        text: typographyColor[50] ?? "#ecf0f1",
        border: mutedColor[700] ?? "#334155",
        notification: redColor[500] ?? "#e74c3c",
      },
    };
  }

  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: primaryColor[500],
      background: resolvedBackgroundColor ?? backgroundColor.light ?? "#f8f9fa",
      card: resolvedCardColor ?? backgroundColor[50] ?? "#ffffff",
      text: typographyColor[900] ?? "#333333",
      border: mutedColor[300] ?? "#dcdcdc",
      notification: redColor[500] ?? "#e74c3c",
    },
  };
};

const normalizePathname = (path?: string | null): string => {
  if (!path) return "/";
  const withoutQuery = path.split("?")[0] ?? "/";
  const normalized = withoutQuery.trim();
  if (!normalized) return "/";
  return normalized.replace(/\/+$/, "") || "/";
};

const isSameOrDescendantPath = (
  currentPath: string,
  basePath: string,
): boolean => {
  const current = normalizePathname(currentPath);
  const base = normalizePathname(basePath);
  if (base === "/") return current === "/";
  return current === base || current.startsWith(`${base}/`);
};

const DEFAULT_AUTH_PATH_PREFIXES = [
  "/sign-in",
  "/welcome",
  "/auth-entry",
  "/sign-in-password",
  "/sign-in-otp",
  "/sign-up-form",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/sign-out",
];

const buildAuthPathPrefixes = (
  authRoutes: Partial<ReturnType<typeof getAuthRoutesConfig>> | null | undefined,
): string[] => {
  const configured = [
    authRoutes?.welcome,
    authRoutes?.authEntry,
    authRoutes?.signInPassword,
    authRoutes?.signInOtp,
    authRoutes?.signUpForm,
    authRoutes?.forgotPassword,
    authRoutes?.resetPassword,
    authRoutes?.verifyEmail,
    authRoutes?.signOut,
  ]
    .map((value) => normalizePathname(value))
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_AUTH_PATH_PREFIXES, ...configured]));
};

const isLikelyAuthPath = (
  path?: string | null,
  authPrefixes?: string[],
) => {
  const normalized = normalizePathname(path);
  const resolvedAuthPrefixes =
    Array.isArray(authPrefixes) && authPrefixes.length
      ? authPrefixes
      : DEFAULT_AUTH_PATH_PREFIXES;

  return resolvedAuthPrefixes.some((prefix) =>
    isSameOrDescendantPath(normalized, prefix),
  );
};

const defaultLoadingFallbackStyle = {
  container: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  logo: {
    width: 180,
    height: 180,
  },
  title: {
    marginTop: 14,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600" as const,
  },
  subtitle: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 13,
    opacity: 0.9,
  },
};

function JBProfileCompletionNavigationGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { authStatus, isAuthenticated } = useJBAuth();
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const activeProfileId = useAuthStore(
    (state: any) =>
      state?.activeProfile?.id ?? state?.defaultProfile?.id ?? null,
  );
  const profileCompletion = useJBProfileCompletion();
  const [showSuggestedDialog, setShowSuggestedDialog] = useState(false);

  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        auth: {
          ...baseConfig.auth,
          ...(appConfig?.auth ?? {}),
        },
      } as JBAppConfig),
    [appConfig, baseConfig],
  );

  const accountConfig = useMemo(
    () => getAuthAccountConfig(mergedConfig),
    [mergedConfig],
  );
  const authRoutes = useMemo(
    () => getAuthRoutesConfig(mergedConfig),
    [mergedConfig],
  );
  const accountScreensConfig = useMemo(
    () => getAuthAccountScreensConfig(mergedConfig),
    [mergedConfig],
  );

  const completionPath = useMemo(
    () =>
      profileCompletion.profileCompletionPath ||
      accountConfig.profileCompletionPath ||
      authRoutes.profileCompletionPath,
    [
      accountConfig.profileCompletionPath,
      authRoutes.profileCompletionPath,
      profileCompletion.profileCompletionPath,
    ],
  );
  const completionBasePath = useMemo(
    () => normalizePathname(completionPath),
    [completionPath],
  );
  const completionFallbackPath = useMemo(
    () =>
      accountScreensConfig?.routing?.homePathAfterProfileSwitch?.trim() || "/",
    [accountScreensConfig?.routing?.homePathAfterProfileSwitch],
  );
  const attemptedPathRef = useRef<string | null>(null);
  const forcedCompletionActiveRef = useRef(false);
  const suggestedPromptKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated" || !isAuthenticated) {
      forcedCompletionActiveRef.current = false;
      attemptedPathRef.current = null;
      suggestedPromptKeyRef.current = null;
      setShowSuggestedDialog(false);
      return;
    }
    if (!profileCompletion.enabled) {
      forcedCompletionActiveRef.current = false;
      suggestedPromptKeyRef.current = null;
      setShowSuggestedDialog(false);
      return;
    }
    if (accountConfig.profileCompletionMode !== "enforced") {
      forcedCompletionActiveRef.current = false;
      if (accountConfig.profileCompletionMode === "suggested") {
        if (profileCompletion.isComplete) {
          suggestedPromptKeyRef.current = null;
          setShowSuggestedDialog(false);
          return;
        }

        const isOnCompletionPath = isSameOrDescendantPath(
          pathname,
          completionBasePath,
        );
        const promptKey = `${String(
          activeProfileId ?? "none",
        )}::${profileCompletion.missingFields.join(",")}`;
        const shouldShowPrompt =
          !isOnCompletionPath && suggestedPromptKeyRef.current !== promptKey;

        if (shouldShowPrompt) {
          suggestedPromptKeyRef.current = promptKey;
          setShowSuggestedDialog(true);
        }

        return;
      }

      return;
    }
    const isOnCompletionPath = isSameOrDescendantPath(
      pathname,
      completionBasePath,
    );

    if (!profileCompletion.isComplete) {
      forcedCompletionActiveRef.current = true;
      if (!isOnCompletionPath) {
        attemptedPathRef.current = pathname;
        router.replace(completionPath as any);
      }
      return;
    }

    if (forcedCompletionActiveRef.current && isOnCompletionPath) {
      const attemptedPath = normalizePathname(attemptedPathRef.current);
      const targetPath =
        attemptedPath && attemptedPath !== completionBasePath
          ? attemptedPath
          : normalizePathname(completionFallbackPath);

      forcedCompletionActiveRef.current = false;
      attemptedPathRef.current = null;

      if (targetPath && !isSameOrDescendantPath(pathname, targetPath)) {
        router.replace(targetPath as any);
      }
      return;
    }

    forcedCompletionActiveRef.current = false;
    attemptedPathRef.current = null;
  }, [
    accountConfig.profileCompletionMode,
    activeProfileId,
    completionFallbackPath,
    authStatus,
    completionBasePath,
    completionPath,
    isAuthenticated,
    pathname,
    profileCompletion.enabled,
    profileCompletion.isComplete,
    profileCompletion.missingFields,
    router,
  ]);

  return (
    <ConfirmationDialog
      open={showSuggestedDialog}
      setOpen={setShowSuggestedDialog}
      showIcon={false}
      title="Completa tu perfil"
      content="Te recomendamos completar tu perfil para mejorar la experiencia de reserva y seguridad en tu cuenta."
      agreeText="Ir a completar perfil"
      agreeColor="primary"
      agreeVariant="outline"
      disagreeText="Tal vez en otro momento"
      disagreeColor="primary"
      disagreeVariant="link"
      footerLayout="column"
      closeOnAgree={false}
      contentClassName="w-full max-w-[415px] items-center gap-4 rounded-3xl border border-outline-200 bg-background-light px-5 py-7 dark:border-outline-700 dark:bg-background-0"
      footerClassName="pt-1"
      onAgree={() => {
        setShowSuggestedDialog(false);
        router.push(completionPath as any);
      }}
      onDisAgree={() => {
        setShowSuggestedDialog(false);
      }}
    />
  );
}

function JBPermissionsNavigationGuard({
  gateNavigationLockRef,
}: {
  gateNavigationLockRef: React.MutableRefObject<boolean>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { authStatus, isAuthenticated } = useJBAuth();
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const activeProfileId = useAuthStore(
    (state: any) => state?.activeProfile?.id ?? state?.defaultProfile?.id ?? null,
  );
  const authUserId = useAuthStore(
    (state: any) => state?.user?.id ?? state?.user?.pk ?? null,
  );
  const [missingPermissions, setMissingPermissions] = useState<string[]>([]);
  const attemptedPathRef = useRef<string | null>(null);
  const isNavigatingRef = useRef(false);
  const [appActiveTick, setAppActiveTick] = useState(0);

  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        auth: {
          ...(baseConfig.auth ?? {}),
          ...(appConfig?.auth ?? {}),
        },
        settings: {
          ...(baseConfig.settings ?? {}),
          ...(appConfig?.settings ?? {}),
        },
        permissions: {
          ...(baseConfig.permissions ?? {}),
          ...(appConfig?.permissions ?? {}),
        },
      } as JBAppConfig),
    [appConfig?.auth, appConfig?.permissions, appConfig?.settings, baseConfig],
  );
  const permissionsConfig = useMemo(
    () => getPermissionsConfig(mergedConfig),
    [mergedConfig],
  );
  const settingsRoutes = useMemo(
    () => getSettingsRoutesConfig(mergedConfig),
    [mergedConfig],
  );
  const authRoutes = useMemo(
    () => getAuthRoutesConfig(mergedConfig),
    [mergedConfig],
  );
  const authPathPrefixes = useMemo(
    () => buildAuthPathPrefixes(authRoutes),
    [authRoutes],
  );
  const requiredPermissions = useMemo(
    () =>
      Array.isArray(permissionsConfig.required)
        ? permissionsConfig.required
        : [],
    [permissionsConfig.required],
  );
  const guardPath = useMemo(() => {
    const configuredPath = String(permissionsConfig.guard?.setupPath ?? "").trim();
    if (configuredPath) {
      return configuredPath.startsWith("/")
        ? configuredPath
        : `/${configuredPath.replace(/^\/+/, "")}`;
    }
    return settingsRoutes.permissions;
  }, [permissionsConfig.guard?.setupPath, settingsRoutes.permissions]);
  const guardBasePath = useMemo(() => normalizePathname(guardPath), [guardPath]);
  const guardEnabled = Boolean(permissionsConfig.guard?.enabled);
  const authenticatedOnly = Boolean(permissionsConfig.guard?.authenticatedOnly);
  const guardMode =
    permissionsConfig.guard?.mode === "strict" ? "strict" : "remindable";
  const reminderKey = useMemo(
    () =>
      buildPermissionsGuardReminderKey({
        isAuthenticated,
        userId: authUserId,
        profileId: activeProfileId,
      }),
    [activeProfileId, authUserId, isAuthenticated],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        setAppActiveTick((prev) => prev + 1);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!guardEnabled || requiredPermissions.length === 0) {
      setMissingPermissions([]);
      attemptedPathRef.current = null;
      return;
    }
    if (authStatus === "configuring") return;
    if (authenticatedOnly && !isAuthenticated) {
      setMissingPermissions([]);
      attemptedPathRef.current = null;
      return;
    }

    let cancelled = false;
    const now = Date.now();

    const runCheck = async () => {
      const statuses = await Promise.all(
        requiredPermissions.map(async (permission) => {
          const status = await getJBPermissionStatus(permission as any);
          return { permission, status };
        }),
      );
      if (cancelled) return;

      const nextMissing = statuses
        .filter((item) => item.status !== "granted")
        .map((item) => String(item.permission));

      setMissingPermissions(nextMissing);

      const onGuardPath = isSameOrDescendantPath(pathname, guardBasePath);
      const onAuthPath = isLikelyAuthPath(pathname, authPathPrefixes);

      if (nextMissing.length === 0) {
        await clearPermissionsGuardNextPromptAt(reminderKey);
        if (cancelled) return;

        if (guardMode === "strict" && onGuardPath) {
          const targetPath = normalizePathname(attemptedPathRef.current);
          attemptedPathRef.current = null;
          const fallbackTarget = targetPath || "/";
          if (
            fallbackTarget &&
            !isSameOrDescendantPath(pathname, fallbackTarget)
          ) {
            router.replace(fallbackTarget as any);
          }
        }
        return;
      }

      if (onGuardPath || isNavigatingRef.current || gateNavigationLockRef.current) {
        return;
      }

      if (guardMode === "strict") {
        attemptedPathRef.current = pathname;
        isNavigatingRef.current = true;
        gateNavigationLockRef.current = true;
        router.replace(guardPath as any);
        setTimeout(() => {
          isNavigatingRef.current = false;
          gateNavigationLockRef.current = false;
        }, 450);
        return;
      }

      if (!onAuthPath) {
        const nextPromptAt = await getPermissionsGuardNextPromptAt(reminderKey);
        if (cancelled) return;
        if (nextPromptAt && now < nextPromptAt) {
          return;
        }
      }

      attemptedPathRef.current = pathname;
      isNavigatingRef.current = true;
      gateNavigationLockRef.current = true;
      router.push(guardPath as any);
      setTimeout(() => {
        isNavigatingRef.current = false;
        gateNavigationLockRef.current = false;
      }, 450);
    };

    void runCheck();

    return () => {
      cancelled = true;
    };
  }, [
    activeProfileId,
    appActiveTick,
    authStatus,
    authUserId,
    authenticatedOnly,
    guardBasePath,
    guardEnabled,
    guardMode,
    guardPath,
    isAuthenticated,
    pathname,
    authPathPrefixes,
    gateNavigationLockRef,
    reminderKey,
    requiredPermissions,
    requiredPermissions.length,
    router,
  ]);

  return null;
}

function JBBiometricsActivationPromptGuard() {
  const { authStatus, isAuthenticated } = useJBAuth();
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const [showPrompt, setShowPrompt] = useState(false);
  const previousAuthStatusRef = useRef<JBAuthStatus>("configuring");
  const shouldEvaluateRef = useRef(false);

  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        settings: {
          ...(baseConfig.settings ?? {}),
          ...(appConfig?.settings ?? {}),
        },
      } as JBAppConfig),
    [appConfig?.settings, baseConfig],
  );

  const settingsConfig = useMemo(
    () => getSettingsConfig(mergedConfig),
    [mergedConfig],
  );
  const securityConfig = settingsConfig.security ?? {};
  const biometricsFeatureEnabled = Boolean(securityConfig.biometricsEnabled);
  const shouldPromptOnLogin = securityConfig.biometricsPromptOnLogin !== false;
  const allowDeviceCredentialFallback =
    securityConfig.allowDeviceCredentialFallback !== false;
  const {
    availability,
    isAvailabilityLoaded,
    isEnabled,
    isPromptDismissed,
    refreshAvailability,
    setEnabled,
    setPromptDismissed,
    authenticate,
  } = useJBBiometricsState();
  const biometricLabel = availability?.label ?? "Biometría";

  useEffect(() => {
    const previousStatus = previousAuthStatusRef.current;
    const transitionedToAuthenticated =
      previousStatus === "unauthenticated" &&
      authStatus === "authenticated" &&
      isAuthenticated;

    if (transitionedToAuthenticated) {
      shouldEvaluateRef.current = true;
      void refreshAvailability();
    }

    if (authStatus === "unauthenticated" || !isAuthenticated) {
      shouldEvaluateRef.current = false;
      setShowPrompt(false);
    }

    previousAuthStatusRef.current = authStatus;
  }, [authStatus, isAuthenticated, refreshAvailability]);

  useEffect(() => {
    if (!shouldEvaluateRef.current) return;
    if (!biometricsFeatureEnabled || !shouldPromptOnLogin) {
      shouldEvaluateRef.current = false;
      return;
    }
    if (isEnabled || isPromptDismissed) {
      shouldEvaluateRef.current = false;
      return;
    }
    if (!isAvailabilityLoaded) return;
    if (!isJBBiometricsAvailable(availability)) {
      shouldEvaluateRef.current = false;
      return;
    }

    setShowPrompt(true);
    shouldEvaluateRef.current = false;
  }, [
    availability,
    biometricsFeatureEnabled,
    isAvailabilityLoaded,
    isEnabled,
    isPromptDismissed,
    shouldPromptOnLogin,
  ]);

  const biometricIcon = (
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(16,185,129,0.12)",
        marginBottom: 4,
      }}
    >
      <RNText style={{ fontSize: 30 }}>
        {Platform.OS === "ios" && biometricLabel?.toLowerCase().includes("face")
          ? "🪪"
          : "🔐"}
      </RNText>
    </View>
  );

  return (
    <ConfirmationDialog
      open={showPrompt}
      setOpen={setShowPrompt}
      showIcon
      icon={biometricIcon}
      title={`Activa ${biometricLabel}`}
      content={`Usa ${biometricLabel} para desbloquear tu sesión de forma rápida y segura. Podrás desactivarlo en cualquier momento desde Ajustes.`}
      agreeText={`Activar ${biometricLabel}`}
      agreeColor="primary"
      agreeVariant="solid"
      disagreeText="Ahora no"
      disagreeColor="secondary"
      disagreeVariant="link"
      footerLayout="column"
      footerReverse
      closeOnAgree={false}
      contentClassName="w-full max-w-[415px] items-center gap-4 rounded-3xl border border-outline-200 bg-background-light px-6 py-8 dark:border-outline-700 dark:bg-background-0"
      onAgree={async () => {
        const result = await authenticate({
          context: "enable",
          label: biometricLabel,
          allowDeviceCredentialFallback,
        });
        if (result.success) {
          await setEnabled(true);
          await setPromptDismissed(false);
        }
        setShowPrompt(false);
      }}
      onDisAgree={async () => {
        await setPromptDismissed(true);
        setShowPrompt(false);
      }}
    />
  );
}

function JBAnnouncementsNavigationGuard({
  gateNavigationLockRef,
  blockAutoOpen,
}: {
  gateNavigationLockRef: React.MutableRefObject<boolean>;
  blockAutoOpen?: boolean;
}) {
  useJBAnnouncementsGuard({
    gateNavigationLockRef,
    blockAutoOpen,
  });
  return null;
}

function JBPushNotificationsBridge() {
  const { authStatus, isAuthenticated } = useJBAuth();
  const router = useRouter();
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const syncSignatureRef = useRef<string>("");
  const syncInProgressRef = useRef(false);

  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        auth: {
          ...(baseConfig.auth ?? {}),
          ...(appConfig?.auth ?? {}),
        },
        settings: {
          ...(baseConfig.settings ?? {}),
          ...(appConfig?.settings ?? {}),
        },
      } as JBAppConfig),
    [appConfig?.auth, appConfig?.settings, baseConfig],
  );
  const settingsConfig = useMemo(
    () => getSettingsConfig(mergedConfig),
    [mergedConfig],
  );
  const authRoutes = useMemo(
    () => getAuthRoutesConfig(mergedConfig),
    [mergedConfig],
  );
  const authPathPrefixes = useMemo(
    () => buildAuthPathPrefixes(authRoutes),
    [authRoutes],
  );

  const notificationsConfig = settingsConfig.notifications ?? {};
  const enablePushListeners = notificationsConfig.enablePushListeners !== false;
  const autoSyncPushToken = notificationsConfig.autoSyncPushToken !== false;
  const pushTokenSyncPath = String(
    notificationsConfig.pushTokenSyncPath ?? "",
  ).trim();

  useEffect(() => {
    if (Platform.OS === "web" || !enablePushListeners) {
      return;
    }

    let responseSubscription: { remove: () => void } | null = null;
    let receivedSubscription: { remove: () => void } | null = null;

    void (async () => {
      try {
        const Notifications = await import("expo-notifications");
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        responseSubscription =
          Notifications.addNotificationResponseReceivedListener(
            (response) => {
              const payload = response?.notification?.request?.content?.data;
              const actionPath = String(
                (payload as any)?.actionPath ?? (payload as any)?.action_path ?? "",
              ).trim();

              if (!actionPath || !actionPath.startsWith("/")) return;
              router.push(actionPath as any);
            },
          );

        receivedSubscription =
          Notifications.addNotificationReceivedListener(() => {
            // no-op: foreground handling is delegated to query invalidations in the app layer.
          });
      } catch {
        // Ignore optional notification listener bootstrap failures.
      }
    })();

    return () => {
      responseSubscription?.remove();
      receivedSubscription?.remove();
    };
  }, [enablePushListeners, router]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!autoSyncPushToken) return;
    if (!pushTokenSyncPath || !pushTokenSyncPath.startsWith("/")) return;
    if (!isAuthenticated || authStatus !== "authenticated") {
      syncSignatureRef.current = "";
      return;
    }

    let isCancelled = false;

    const syncPushToken = async () => {
      if (syncInProgressRef.current) return;
      syncInProgressRef.current = true;

      try {
        const device = await loginDeviceInfo({
          requestNotificationPermission: false,
        });

        const deviceToken = String(device?.token ?? "").trim();
        if (!deviceToken) return;

        const notificationToken = String(device?.notificationToken ?? "").trim();
        const syncSignature = `${deviceToken}:${notificationToken || "<none>"}`;
        if (syncSignatureRef.current === syncSignature) return;

        await customAxiosAuthenticated.post(pushTokenSyncPath, {
          deviceToken,
          notificationToken: notificationToken || null,
          platform: device?.platform,
          name: device?.name,
        });

        if (!isCancelled) {
          syncSignatureRef.current = syncSignature;
        }
      } catch {
        // Ignore sync failures; retry on next foreground/auth cycle.
      } finally {
        syncInProgressRef.current = false;
      }
    };

    void syncPushToken();
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void syncPushToken();
      }
    });

    return () => {
      isCancelled = true;
      appStateSubscription.remove();
    };
  }, [authStatus, autoSyncPushToken, isAuthenticated, pushTokenSyncPath]);

  return null;
}

function JBBiometricsAppLockOverlay() {
  const { authStatus, isAuthenticated, signOut } = useJBAuth();
  const pathname = usePathname();
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const lockTriggeredForSessionRef = useRef(false);
  const skipNextOpenLockRef = useRef(false);
  const previousAuthStatusRef = useRef<JBAuthStatus>("configuring");

  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        auth: {
          ...(baseConfig.auth ?? {}),
          ...(appConfig?.auth ?? {}),
        },
        settings: {
          ...(baseConfig.settings ?? {}),
          ...(appConfig?.settings ?? {}),
        },
      } as JBAppConfig),
    [appConfig?.auth, appConfig?.settings, baseConfig],
  );
  const settingsConfig = useMemo(
    () => getSettingsConfig(mergedConfig),
    [mergedConfig],
  );
  const authRoutes = useMemo(
    () => getAuthRoutesConfig(mergedConfig),
    [mergedConfig],
  );
  const authPathPrefixes = useMemo(
    () => buildAuthPathPrefixes(authRoutes),
    [authRoutes],
  );
  const colorScheme = useColorScheme();
  const resolvedMode = colorScheme === "dark" ? "dark" : "light";
  const uiConfig = baseConfig?.ui;
  const lockScreenBg = resolveJBUIColor(
    uiConfig?.lockScreen?.backgroundColor,
    resolvedMode,
    undefined,
  );
  const lockScreenTextColor = resolveJBUIColor(
    uiConfig?.lockScreen?.textColor,
    resolvedMode,
    undefined,
  );
  const securityConfig = settingsConfig.security ?? {};
  const lockMode = securityConfig.biometricsLockMode ?? "on_app_open";
  const lockTimeoutSecondsRaw = Number(
    securityConfig.biometricsLockTimeoutSeconds,
  );
  const lockTimeoutMs =
    Number.isFinite(lockTimeoutSecondsRaw) && lockTimeoutSecondsRaw > 0
      ? lockTimeoutSecondsRaw * 1000
      : 300000;
  const allowDeviceCredentialFallback =
    securityConfig.allowDeviceCredentialFallback !== false;

  const {
    availability,
    isAvailabilityLoaded,
    isEnabled,
    lastUnlockAt,
    refreshAvailability,
    markUnlockedNow,
    authenticate,
  } = useJBBiometricsState();
  const biometricLabel = availability?.label ?? "Biometría";

  const shouldProtect = useMemo(() => {
    if (!Boolean(securityConfig.biometricsEnabled)) return false;
    if (!isAuthenticated || authStatus !== "authenticated") return false;
    if (isLikelyAuthPath(pathname, authPathPrefixes)) return false;
    if (!isEnabled) return false;
    if (!isAvailabilityLoaded) return false;
    return isJBBiometricsAvailable(availability);
  }, [
    authStatus,
    authPathPrefixes,
    availability,
    isAuthenticated,
    isAvailabilityLoaded,
    isEnabled,
    pathname,
    securityConfig.biometricsEnabled,
  ]);

  useEffect(() => {
    const previousStatus = previousAuthStatusRef.current;
    if (
      previousStatus === "unauthenticated" &&
      authStatus === "authenticated" &&
      isAuthenticated
    ) {
      skipNextOpenLockRef.current = true;
      lockTriggeredForSessionRef.current = false;
    }

    if (authStatus === "unauthenticated" || !isAuthenticated) {
      lockTriggeredForSessionRef.current = false;
      skipNextOpenLockRef.current = false;
      setIsLocked(false);
    }

    previousAuthStatusRef.current = authStatus;
  }, [authStatus, isAuthenticated]);

  useEffect(() => {
    if (!shouldProtect) {
      setIsLocked(false);
      return;
    }
    void refreshAvailability();
  }, [refreshAvailability, shouldProtect]);

  useEffect(() => {
    if (!shouldProtect) return;
    if (lockMode === "on_app_open") {
      if (!lockTriggeredForSessionRef.current) {
        lockTriggeredForSessionRef.current = true;
        if (!skipNextOpenLockRef.current) {
          setIsLocked(true);
        }
        skipNextOpenLockRef.current = false;
      }
      return;
    }

    if (!lockTriggeredForSessionRef.current) {
      lockTriggeredForSessionRef.current = true;
      if (lockMode === "every_foreground") {
        setIsLocked(true);
        return;
      }

      if (!lastUnlockAt || Date.now() - lastUnlockAt >= lockTimeoutMs) {
        setIsLocked(true);
      }
    }
  }, [lastUnlockAt, lockMode, lockTimeoutMs, shouldProtect]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      const becameActive =
        nextState === "active" &&
        (previousState === "inactive" || previousState === "background");

      if (!becameActive || !shouldProtect) return;

      if (lockMode === "every_foreground") {
        setIsLocked(true);
        return;
      }

      if (lockMode === "foreground_timeout") {
        if (!lastUnlockAt || Date.now() - lastUnlockAt >= lockTimeoutMs) {
          setIsLocked(true);
        }
      }
    });

    return () => subscription.remove();
  }, [lastUnlockAt, lockMode, lockTimeoutMs, shouldProtect]);

  const handleUnlock = useCallback(async () => {
    if (isAuthenticating || !shouldProtect) return;

    setIsAuthenticating(true);
    try {
      const result = await authenticate({
        context: "unlock",
        label: biometricLabel,
        allowDeviceCredentialFallback,
      });

      if (result.success) {
        await markUnlockedNow();
        setIsLocked(false);
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [
    allowDeviceCredentialFallback,
    authenticate,
    biometricLabel,
    isAuthenticating,
    markUnlockedNow,
    shouldProtect,
  ]);

  useEffect(() => {
    if (!isLocked || !shouldProtect || isAuthenticating) return;
    void handleUnlock();
  }, [handleUnlock, isAuthenticating, isLocked, shouldProtect]);

  if (!shouldProtect || !isLocked) {
    return null;
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 9999,
        elevation: 80,
      }}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: lockScreenBg ?? getColor("primary")?.[500] ?? "#0ea5e9",
          paddingHorizontal: 24,
        }}
      >
        <RNText
          style={{
            color: lockScreenTextColor ?? "#ffffff",
            fontSize: 30,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Desbloqueo de seguridad
        </RNText>
        <RNText
          style={{
            color: lockScreenTextColor
              ? `${lockScreenTextColor}cc`
              : "rgba(255,255,255,0.95)",
            fontSize: 16,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Desbloquea la aplicación con {biometricLabel}.
        </RNText>
        <View style={{ width: "100%", maxWidth: 360, marginTop: 26 }}>
          <JBFormButton
            text={isAuthenticating ? "Validando..." : "Reintentar"}
            action="primary"
            variant="solid"
            isDisabled={isAuthenticating}
            onPress={() => void handleUnlock()}
          />
          <JBFormButton
            text="Cerrar sesión"
            action="negative"
            variant="link"
            className="mt-3"
            onPress={() => void signOut()}
          />
        </View>
      </View>
    </View>
  );
}

export function JBExpoRootLayout({
  authClient,
  appMeta,
  colorMode,
  uiConfig,
  withStatusBar = true,
  statusBarStyle = "light",
  stripeConfig,
  unauthenticatedInitialRouteGroup = "(app)",
  manageNativeSplash = true,
  onAuthStateChanged,
  underMaintenanceFallback,
  loadingFallback,
  queryClientOptions,
  ...providersProps
}: JBExpoRootLayoutProps) {
  const baseConfig = getLastCreatedJBExpoConfig();
  const StripeProvider = useMemo(() => getOptionalStripeProvider(), []);
  const resolvedStripeConfig = useMemo(
    () => resolveStripeRuntimeConfig(baseConfig, stripeConfig),
    [baseConfig, stripeConfig],
  );
  const scheme = useColorScheme();
  const effectiveMode = colorMode ?? scheme ?? "light";
  const resolvedMode =
    effectiveMode === "dark"
      ? "dark"
      : effectiveMode === "light"
      ? "light"
      : scheme ?? "light";
  const resolvedUIConfig = uiConfig ?? baseConfig?.ui;
  const resolvedThemeOverrides =
    providersProps.themeOverrides ?? resolvedUIConfig?.themeOverrides;
  const navigationTheme = resolveNavigationTheme(
    resolvedMode,
    resolvedUIConfig,
  );
  const primaryColor = getColor("primary");
  const resolvedHeaderBackgroundColor = resolveJBUIColor(
    resolvedUIConfig?.header?.backgroundColor,
    resolvedMode,
    primaryColor[500],
  );
  const resolvedHeaderTintColor = resolveJBUIColor(
    resolvedUIConfig?.header?.tintColor,
    resolvedMode,
    "white",
  );
  const effectiveStatusBarStyle =
    statusBarStyle === "auto"
      ? resolvedMode === "dark"
        ? "light"
        : "dark"
      : statusBarStyle;

  const { isConfigLoaded, fetchAppConfig, appConfig, updateInfo } = useAppConfigStore();
  const setSessionFromJBAuth = useAuthStore(
    (state: any) => state.setSessionFromJBAuth,
  );
  const signout = useAuthStore((state: any) => state.signout);
  const setOfflineMode = useOfflineStore((state: any) => state.setMode);
  const setConnectivity = useOfflineStore((state: any) => state.setConnectivity);
  const continueOfflineReadOnly = useOfflineStore(
    (state: any) => state.continueOfflineReadOnly,
  );
  const clearOfflineReadOnly = useOfflineStore(
    (state: any) => state.clearOfflineReadOnly,
  );
  const isOffline = useOfflineStore((state: any) => Boolean(state.isOffline));
  const continueOffline = useOfflineStore((state: any) =>
    Boolean(state.continueOffline),
  );

  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        settings: {
          ...(baseConfig.settings ?? {}),
          ...(appConfig?.settings ?? {}),
        },
        permissions: {
          ...(baseConfig.permissions ?? {}),
          ...(appConfig?.permissions ?? {}),
        },
        runtime: {
          ...(baseConfig.runtime ?? {}),
          ...(appConfig?.runtime ?? {}),
        },
      } as JBAppConfig),
    [appConfig?.permissions, appConfig?.runtime, appConfig?.settings, baseConfig],
  );

  const runtimeOfflineConfig = useMemo(
    () => getRuntimeOfflineConfig(mergedConfig),
    [mergedConfig],
  );
  const runtimeAppStatusConfig = useMemo(
    () => getRuntimeAppStatusConfig(mergedConfig),
    [mergedConfig],
  );
  const runtimeLoadingConfig = useMemo(
    () => getRuntimeLoadingConfig(mergedConfig),
    [mergedConfig],
  );
  const settingsConfig = useMemo(
    () => getSettingsConfig(mergedConfig),
    [mergedConfig],
  );
  const permissionsConfig = useMemo(
    () => getPermissionsConfig(mergedConfig),
    [mergedConfig],
  );
  const currentAppVersion = useMemo(
    () =>
      Application.nativeApplicationVersion?.trim() ||
      Application.nativeBuildVersion?.trim() ||
      "",
    [],
  );

  const appStatus = useMemo(
    () =>
      resolveAppStatus({
        statusData: appConfig ?? null,
        updateInfo: updateInfo ?? null,
        strategy: runtimeAppStatusConfig.strategy,
        enforceUpdateInProductionOnly:
          runtimeAppStatusConfig.enforceUpdateInProductionOnly,
        blockOnStoreMandatoryUpdate:
          runtimeAppStatusConfig.blockOnStoreMandatoryUpdate,
        blockOnRemoteOutdated: runtimeAppStatusConfig.blockOnRemoteOutdated,
        currentVersion: currentAppVersion,
        fallbackUpdateUrl: runtimeAppStatusConfig.updateUrl,
        iosStoreUrl:
          runtimeAppStatusConfig.iosStoreUrl || settingsConfig.version?.iosStoreUrl,
        androidStoreUrl:
          runtimeAppStatusConfig.androidStoreUrl ||
          settingsConfig.version?.androidStoreUrl,
        stage: mergedConfig.stage,
        platform: Platform.OS as "ios" | "android" | "web",
      }),
    [
      appConfig,
      currentAppVersion,
      mergedConfig.stage,
      runtimeAppStatusConfig.androidStoreUrl,
      runtimeAppStatusConfig.blockOnRemoteOutdated,
      runtimeAppStatusConfig.blockOnStoreMandatoryUpdate,
      runtimeAppStatusConfig.enforceUpdateInProductionOnly,
      runtimeAppStatusConfig.iosStoreUrl,
      runtimeAppStatusConfig.strategy,
      runtimeAppStatusConfig.updateUrl,
      settingsConfig.version?.androidStoreUrl,
      settingsConfig.version?.iosStoreUrl,
      updateInfo,
    ],
  );
  const [isBootstrapReady, setIsBootstrapReady] = useState(false);
  const bootCompletedRef = useRef(false);
  const gateNavigationLockRef = useRef(false);

  useEffect(() => {
    if (!manageNativeSplash || Platform.OS === "web") {
      return;
    }
    SplashScreen.preventAutoHideAsync().catch(() => {});
  }, [manageNativeSplash]);

  useEffect(() => {
    fetchAppConfig();
  }, [fetchAppConfig]);

  useEffect(() => {
    if (!isConfigLoaded) {
      setIsBootstrapReady(false);
      bootCompletedRef.current = false;
      return;
    }
    if (bootCompletedRef.current) {
      setIsBootstrapReady(true);
      return;
    }

    let cancelled = false;

    const runBootstrap = async () => {
      const guardEnabled = Boolean(permissionsConfig.guard?.enabled);
      const requiredPermissions = Array.isArray(permissionsConfig.required)
        ? permissionsConfig.required
        : [];

      if (guardEnabled && requiredPermissions.length > 0) {
        await Promise.all(
          requiredPermissions.map(async (permission) => {
            try {
              await getJBPermissionStatus(permission as any);
            } catch {
              // Ignore bootstrap errors and continue.
            }
          }),
        );
      }

      if (cancelled) return;
      bootCompletedRef.current = true;
      setIsBootstrapReady(true);
    };

    void runBootstrap();

    return () => {
      cancelled = true;
    };
  }, [isConfigLoaded, permissionsConfig.guard?.enabled, permissionsConfig.required]);

  useEffect(() => {
    const mode = runtimeOfflineConfig.mode ?? "blocking_with_offline";
    setOfflineMode(mode);
  }, [runtimeOfflineConfig.mode, setOfflineMode]);

  useEffect(() => {
    const OFFLINE_DEBOUNCE_MS = 3000;
    const appStateRef = { current: AppState.currentState };
    let offlineTimer: ReturnType<typeof setTimeout> | null = null;
    let lastKnownConnected = true;

    const clearOfflineTimer = () => {
      if (offlineTimer) {
        clearTimeout(offlineTimer);
        offlineTimer = null;
      }
    };

    const applyConnectivity = (isConnected: boolean) => {
      lastKnownConnected = isConnected;
      if (isConnected) {
        clearOfflineTimer();
        setConnectivity(true);
        return;
      }

      if (appStateRef.current !== "active") {
        return;
      }

      clearOfflineTimer();
      offlineTimer = setTimeout(() => {
        if (appStateRef.current === "active" && !lastKnownConnected) {
          setConnectivity(false);
        }
      }, OFFLINE_DEBOUNCE_MS);
    };

    const handleNetInfoState = (state: {
      isConnected: boolean | null;
      isInternetReachable: boolean | null;
    }) => {
      const isConnected = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );
      applyConnectivity(isConnected);
    };

    const netInfoSubscription = NetInfo.addEventListener(handleNetInfoState);
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState !== "active") {
        clearOfflineTimer();
        return;
      }
      void NetInfo.fetch().then(handleNetInfoState);
    });

    void NetInfo.fetch().then(handleNetInfoState);

    return () => {
      clearOfflineTimer();
      appStateSubscription.remove();
      netInfoSubscription();
    };
  }, [setConnectivity]);

  useEffect(() => {
    if (!isOffline) {
      clearOfflineReadOnly();
    }
  }, [clearOfflineReadOnly, isOffline]);

  useEffect(() => {
    if (
      !manageNativeSplash ||
      Platform.OS === "web" ||
      !isConfigLoaded ||
      !isBootstrapReady
    ) {
      return;
    }
    SplashScreen.hideAsync().catch(() => {});
  }, [isBootstrapReady, isConfigLoaded, manageNativeSplash]);

  useEffect(() => {
    const locale = (
      appConfig?.momentLocale ??
      baseConfig?.momentLocale ??
      "es-mx"
    ).toLowerCase();
    moment.locale(locale);
  }, [appConfig?.momentLocale, baseConfig?.momentLocale]);

  const handleAuthStateChanged = useCallback(
    (state: {
      authStatus: JBAuthStatus;
      isAuthenticated: boolean;
      user: unknown | null;
    }) => {
      onAuthStateChanged?.(state);

      if (!state.isAuthenticated) {
        if (state.authStatus === "unauthenticated") {
          signout();
        }
        return;
      }

      void (async () => {
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        try {
          accessToken = await authClient.getAccessToken();
          refreshToken = await authClient.tokenStorage.getRefreshToken();
        } catch {
          // Keep auth store synchronized with provider auth state even if token reads fail.
        } finally {
          setSessionFromJBAuth({
            user: state.user,
            accessToken,
            refreshToken,
          });
        }
      })();
    },
    [authClient, onAuthStateChanged, setSessionFromJBAuth, signout],
  );

  if (!isConfigLoaded || !isBootstrapReady) {
    const resolvedLoadingBackgroundColor = resolveJBUIColor(
      runtimeLoadingConfig?.backgroundColor,
      resolvedMode,
      resolvedHeaderBackgroundColor ?? primaryColor[500],
    );
    const resolvedLoadingTextColor = resolveJBUIColor(
      runtimeLoadingConfig?.textColor,
      resolvedMode,
      "#ffffff",
    );
    const resolvedLoadingIndicatorColor = resolveJBUIColor(
      runtimeLoadingConfig?.indicatorColor,
      resolvedMode,
      "#ffffff",
    );
    const logoWidth =
      runtimeLoadingConfig?.logoWidth ?? defaultLoadingFallbackStyle.logo.width;
    const logoHeight =
      runtimeLoadingConfig?.logoHeight ?? defaultLoadingFallbackStyle.logo.height;
    const showIndicator = runtimeLoadingConfig?.showIndicator !== false;
    const fallbackTitle =
      runtimeLoadingConfig?.title?.trim() || appMeta?.name || "Cargando...";
    const fallbackSubtitle = runtimeLoadingConfig?.subtitle?.trim();

    const fallback =
      loadingFallback ?? (
        <View
          style={[
            defaultLoadingFallbackStyle.container,
            {
              backgroundColor:
                resolvedLoadingBackgroundColor ??
                resolvedHeaderBackgroundColor ??
                primaryColor[500],
            },
          ]}
        >
          {runtimeLoadingConfig?.logoSource ? (
            <Image
              source={runtimeLoadingConfig.logoSource as any}
              resizeMode="contain"
              style={[
                defaultLoadingFallbackStyle.logo,
                { width: logoWidth, height: logoHeight },
              ]}
            />
          ) : null}
          {showIndicator ? (
            <ActivityIndicator
              color={resolvedLoadingIndicatorColor ?? "#ffffff"}
              size="large"
              style={{ marginTop: runtimeLoadingConfig?.logoSource ? 18 : 0 }}
            />
          ) : null}
          <RNText
            style={[
              defaultLoadingFallbackStyle.title,
              { color: resolvedLoadingTextColor ?? "#ffffff" },
            ]}
          >
            {fallbackTitle}
          </RNText>
          {fallbackSubtitle ? (
            <RNText
              style={[
                defaultLoadingFallbackStyle.subtitle,
                { color: resolvedLoadingTextColor ?? "#ffffff" },
              ]}
            >
              {fallbackSubtitle}
            </RNText>
          ) : null}
        </View>
      );

    return (
      <JBExpoAppProviders
        {...providersProps}
        appMeta={appMeta}
        colorMode={effectiveMode}
        themeOverrides={resolvedThemeOverrides}
        navigationTheme={navigationTheme}
        queryClientOptions={{
          onUnauthorized: () => {
            useAuthStore.getState().signout();
          },
          ...queryClientOptions,
        }}
      >
        {fallback}
      </JBExpoAppProviders>
    );
  }

  const offlineMode = runtimeOfflineConfig.mode ?? "blocking_with_offline";
  const shouldShowOfflineGate =
    isOffline &&
    (offlineMode === "strict_blocking" ||
      (offlineMode === "blocking_with_offline" && !continueOffline));

  const rootContent =
    appStatus.blockingReason === "maintenance" ? (
      underMaintenanceFallback ?? (
        <JBUnderMaintenanceScreen
          line1={appStatus.detailMessage || undefined}
          line2={undefined}
        />
      )
    ) : appStatus.blockingReason === "update" ? (
      <JBRequireUpdateScreen
        line1={appStatus.detailMessage || undefined}
        updateUrl={appStatus.updateUrl}
      />
    ) : shouldShowOfflineGate ? (
      <JBOfflineGateScreen
        mode={offlineMode}
        onRetry={() => {
          void NetInfo.fetch().then((state) => {
            const isConnected = Boolean(
              state.isConnected && state.isInternetReachable !== false,
            );
            setConnectivity(isConnected);
          });
        }}
        onContinueOffline={() => continueOfflineReadOnly()}
      />
    ) : (
      <JBAuthProvider
        authClient={authClient}
        onAuthStateChanged={handleAuthStateChanged}
      >
        <JBProfileCompletionNavigationGuard />
        <JBPermissionsNavigationGuard gateNavigationLockRef={gateNavigationLockRef} />
        <JBAnnouncementsNavigationGuard gateNavigationLockRef={gateNavigationLockRef} />
        <JBBiometricsActivationPromptGuard />
        <JBPushNotificationsBridge />
        {withStatusBar ? <StatusBar style={effectiveStatusBarStyle} /> : null}

        <Stack
          initialRouteName={unauthenticatedInitialRouteGroup}
          screenOptions={{
            headerTintColor: resolvedHeaderTintColor ?? "white",
            headerBackTitle: "Volver",
            headerStyle: {
              backgroundColor:
                resolvedHeaderBackgroundColor ?? primaryColor[500],
            },
          }}
        >
          <Stack.Screen
            name="(app)"
            options={{ headerShown: false, animation: "none" }}
          />
          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false, animation: "none" }}
          />
        </Stack>
        <JBBiometricsAppLockOverlay />
      </JBAuthProvider>
    );

  const contentWithOptionalStripe =
    resolvedStripeConfig.enabled &&
    resolvedStripeConfig.publishableKey &&
    StripeProvider ? (
      <StripeProvider
        publishableKey={resolvedStripeConfig.publishableKey}
        merchantIdentifier={resolvedStripeConfig.merchantIdentifier}
        urlScheme={resolvedStripeConfig.urlScheme}
        setReturnUrlSchemeOnAndroid={
          resolvedStripeConfig.setReturnUrlSchemeOnAndroid
        }
      >
        {rootContent}
      </StripeProvider>
    ) : (
      rootContent
    );

  return (
    <JBExpoAppProviders
      {...providersProps}
      appMeta={appMeta}
      colorMode={effectiveMode}
      navigationTheme={navigationTheme}
      queryClientOptions={{
        onUnauthorized: () => {
          useAuthStore.getState().signout();
        },
        ...queryClientOptions,
      }}
    >
      {contentWithOptionalStripe}
    </JBExpoAppProviders>
  );
}
