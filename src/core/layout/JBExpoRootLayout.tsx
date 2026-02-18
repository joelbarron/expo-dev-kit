import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar, StatusBarStyle } from "expo-status-bar";
import React, { useCallback, useEffect } from "react";
import { Platform } from "react-native";

import { JBAuthProvider, JBAuthStatus } from "../../auth";
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

const resolveNavigationTheme = (mode: "light" | "dark"): Theme => {
  const primaryColor = getColor("primary");
  const backgroundColor = getColor("background");
  const typographyColor = getColor("typography");
  const mutedColor = getColor("muted");
  const redColor = getColor("red");

  if (mode === "dark") {
    return {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: primaryColor[500],
        background: backgroundColor[0],
        card: backgroundColor[200],
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
      background: backgroundColor.light ?? "#f8f9fa",
      card: backgroundColor[50] ?? "#ffffff",
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
  withStatusBar = true,
  statusBarStyle = "light",
  manageNativeSplash = true,
  onAuthStateChanged,
  underMaintenanceFallback,
  queryClientOptions,
  ...providersProps
}: JBExpoRootLayoutProps) {
  const scheme = useColorScheme();
  const effectiveMode = colorMode ?? scheme ?? "dark";
  const navigationTheme = resolveNavigationTheme(
    effectiveMode === "dark" ? "dark" : "light",
  );

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
        const accessToken = await authClient.getAccessToken();
        const refreshToken = await authClient.tokenStorage.getRefreshToken();

        setSessionFromJBAuth({
          user: state.user,
          accessToken,
          refreshToken,
        });
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
          {withStatusBar ? <StatusBar style={statusBarStyle} /> : null}

          <Stack
            screenOptions={{
              headerTintColor: "white",
              headerBackTitle: "Volver",
              headerStyle: {
                backgroundColor: getColor("primary")[500],
              },
            }}
          >
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
        </JBAuthProvider>
      )}
    </JBExpoAppProviders>
  );
}
