import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar, StatusBarStyle } from "expo-status-bar";
import moment from "moment";
import "moment/locale/es";
import "moment/locale/es-mx";
import React, { useCallback, useEffect } from "react";
import { Platform } from "react-native";

import { JBAuthProvider, JBAuthStatus } from "../../auth";
import { getLastCreatedJBExpoConfig, JBUIConfig, resolveJBUIColor } from "../../config";
import { useColorScheme } from "../../hooks";
import { useAppConfigStore, useAuthStore } from "../../runtime";
import { getColor } from "../../utils";
import { JBUnderMaintenanceScreen } from "../app-status";
import {
  JBExpoAppProviders,
  JBExpoAppProvidersProps,
} from "./JBExpoAppProviders";

type JBExpoRootLayoutProps = {
  authClient: any;
  appMeta?: JBExpoAppProvidersProps["appMeta"];
  colorMode?: JBExpoAppProvidersProps["colorMode"];
  uiConfig?: JBUIConfig;
  withStatusBar?: boolean;
  statusBarStyle?: StatusBarStyle;
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
      ? (backgroundColor[0] ?? "#070b10")
      : (backgroundColor.light ?? "#f8f9fa");
  const defaultCardColor =
    mode === "dark"
      ? (backgroundColor[200] ?? "#121b26")
      : (backgroundColor[50] ?? "#ffffff");

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

export function JBExpoRootLayout({
  authClient,
  appMeta,
  colorMode,
  uiConfig,
  withStatusBar = true,
  statusBarStyle = "light",
  manageNativeSplash = true,
  onAuthStateChanged,
  underMaintenanceFallback,
  queryClientOptions,
  ...providersProps
}: JBExpoRootLayoutProps) {
  const baseConfig = getLastCreatedJBExpoConfig();
  const scheme = useColorScheme();
  const effectiveMode = colorMode ?? scheme ?? "dark";
  const resolvedMode =
    effectiveMode === "dark"
      ? "dark"
      : effectiveMode === "light"
        ? "light"
        : (scheme ?? "dark");
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
    const locale = (appConfig?.momentLocale ?? baseConfig?.momentLocale ?? "es-mx").toLowerCase();
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
      {appConfig?.underMaintenance ? (
        (underMaintenanceFallback ?? <JBUnderMaintenanceScreen />)
      ) : (
        <JBAuthProvider
          authClient={authClient}
          onAuthStateChanged={handleAuthStateChanged}
        >
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
      )}
    </JBExpoAppProviders>
  );
}
