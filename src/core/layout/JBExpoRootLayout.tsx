import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar, StatusBarStyle } from "expo-status-bar";
import moment from "moment";
import "moment/locale/es";
import "moment/locale/es-mx";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import {
  JBAuthProvider,
  JBAuthStatus,
  useJBAuth,
  useJBProfileCompletion,
} from "../../auth";
import {
  getAuthAccountConfig,
  getAuthAccountScreensConfig,
  getLastCreatedJBExpoConfig,
  JBAppConfig,
  JBAppStage,
  JBAppStageLowercase,
  JBStripeConfig,
  JBStripePublishableKeyConfig,
  JBUIConfig,
  resolveJBUIColor,
} from "../../config";
import { useColorScheme } from "../../hooks";
import { useAppConfigStore, useAuthStore } from "../../runtime";
import { ConfirmationDialog } from "../../shared";
import { getColor } from "../../utils";
import { JBUnderMaintenanceScreen } from "../app-status";
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
  manageNativeSplash?: boolean;
  onAuthStateChanged?: (state: {
    authStatus: JBAuthStatus;
    isAuthenticated: boolean;
    user: unknown | null;
  }) => void;
  underMaintenanceFallback?: React.ReactNode;
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
  const accountScreensConfig = useMemo(
    () => getAuthAccountScreensConfig(mergedConfig),
    [mergedConfig],
  );

  const completionPath = useMemo(
    () =>
      profileCompletion.profileCompletionPath ||
      accountConfig.profileCompletionPath ||
      "/account/complete-profile",
    [
      accountConfig.profileCompletionPath,
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

export function JBExpoRootLayout({
  authClient,
  appMeta,
  colorMode,
  uiConfig,
  withStatusBar = true,
  statusBarStyle = "light",
  stripeConfig,
  manageNativeSplash = true,
  onAuthStateChanged,
  underMaintenanceFallback,
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
  const effectiveMode = colorMode ?? scheme ?? "dark";
  const resolvedMode =
    effectiveMode === "dark"
      ? "dark"
      : effectiveMode === "light"
      ? "light"
      : scheme ?? "dark";
  const resolvedUIConfig = uiConfig ?? baseConfig?.ui;
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

  const { isConfigLoaded, fetchAppConfig, appConfig } = useAppConfigStore();
  const setSessionFromJBAuth = useAuthStore(
    (state: any) => state.setSessionFromJBAuth,
  );
  const signout = useAuthStore((state: any) => state.signout);

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
    if (!manageNativeSplash || Platform.OS === "web" || !isConfigLoaded) {
      return;
    }
    SplashScreen.hideAsync().catch(() => {});
  }, [isConfigLoaded, manageNativeSplash]);

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

  if (!isConfigLoaded) {
    return null;
  }

  const rootContent = appConfig?.underMaintenance ? (
    underMaintenanceFallback ?? <JBUnderMaintenanceScreen />
  ) : (
    <JBAuthProvider
      authClient={authClient}
      onAuthStateChanged={handleAuthStateChanged}
    >
      <JBProfileCompletionNavigationGuard />
      {withStatusBar ? <StatusBar style={effectiveStatusBarStyle} /> : null}

      <Stack
        screenOptions={{
          headerTintColor: resolvedHeaderTintColor ?? "white",
          headerBackTitle: "Volver",
          headerStyle: {
            backgroundColor: resolvedHeaderBackgroundColor ?? primaryColor[500],
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
