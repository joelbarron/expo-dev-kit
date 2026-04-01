import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import { LoginSocialPayload } from "../types";
import {
  JBAuthSocialConfig,
  JBSocialAuthMode,
  JBSocialFallbackMode,
  JBSocialProviderName
} from "../../config";
import { appendSocialDebugLog } from "./socialDebugLogStore";

type SocialProviderRuntimeConfig = JBAuthSocialConfig[JBSocialProviderName] & {
  provider: JBSocialProviderName;
  resolvedClientId: string;
};

type SocialAuthStrategyConfig = {
  defaultMode?: JBSocialAuthMode;
  fallbackMode?: JBSocialFallbackMode;
};

type AuthenticateWithProviderOptions = {
  strategy?: SocialAuthStrategyConfig;
};

WebBrowser.maybeCompleteAuthSession();

const isExpoGoRuntime = (): boolean => {
  try {
    const Constants = require("expo-constants")?.default ?? require("expo-constants");
    return (
      Constants?.appOwnership === "expo" ||
      Constants?.executionEnvironment === "storeClient"
    );
  } catch {
    return false;
  }
};

const logSocialDebug = (enabled: boolean, message: string, payload?: unknown) => {
  if (!enabled) {
    return;
  }
  appendSocialDebugLog(message, payload);
  if (typeof payload === "undefined") {
    console.info(`[jb-auth][social] ${message}`);
    return;
  }
  console.info(`[jb-auth][social] ${message}`, payload);
};

const parseQueryAndFragment = (url: string) => {
  const [, queryPart = ""] = url.split("?");
  const [query = "", fragment = ""] = queryPart.split("#");
  const queryParams = new URLSearchParams(query);
  const fragmentParams = new URLSearchParams(fragment);
  return { queryParams, fragmentParams };
};

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke"
};

const buildGoogleInstalledAppRedirectUri = (clientId: string): string => {
  const prefix = clientId.replace(".apps.googleusercontent.com", "").trim();
  return `com.googleusercontent.apps.${prefix}:/oauth2redirect/google`;
};

const resolveRedirectUri = (
  config: SocialProviderRuntimeConfig,
  provider: "google" | "facebook"
): string => {
  const configured = config.redirectUri?.trim();
  if (configured) {
    if (provider === "google" && !configured.startsWith("com.googleusercontent.apps.")) {
      return buildGoogleInstalledAppRedirectUri(config.resolvedClientId);
    }
    return configured;
  }
  if (provider === "google") {
    return buildGoogleInstalledAppRedirectUri(config.resolvedClientId);
  }
  return Linking.createURL(`auth/${provider}`);
};

const buildFacebookAuthUrl = (config: SocialProviderRuntimeConfig) => {
  const redirectUri = resolveRedirectUri(config, "facebook");
  const scopes = config.scopes?.length ? config.scopes : ["public_profile", "email"];
  const params = new URLSearchParams({
    client_id: config.resolvedClientId,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: scopes.join(",")
  });
  return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
};

const authenticateWithGoogleNative = async (
  config: SocialProviderRuntimeConfig,
  debug = false
): Promise<LoginSocialPayload> => {
  let GoogleSignin: any;
  try {
    const googleSigninModule = require("@react-native-google-signin/google-signin");
    GoogleSignin = googleSigninModule.GoogleSignin;
  } catch {
    throw new Error("Google native sdk not installed.");
  }

  if (!GoogleSignin?.configure || !GoogleSignin?.signIn) {
    throw new Error("Google native sdk is unavailable.");
  }

  const configuredWebClientId =
    config.clientId?.trim() || config.resolvedClientId?.trim() || undefined;

  GoogleSignin.configure({
    webClientId: configuredWebClientId,
    iosClientId:
      Platform.OS === "ios"
        ? (config as JBAuthSocialConfig["google"])?.iosClientId?.trim() || undefined
        : undefined,
    offlineAccess: false
  });

  if (GoogleSignin.hasPlayServices && Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  try {
    await GoogleSignin.signOut?.();
  } catch {
    // Ignore signOut failures before signIn.
  }

  logSocialDebug(debug, "google native auth start");
  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult?.idToken ?? signInResult?.data?.idToken;
  if (!idToken) {
    throw new Error(
      "Google native authentication did not return idToken. Verify auth.social.google.clientId/webClientId and platform client IDs."
    );
  }

  return {
    provider: "google",
    idToken,
    clientId: config.resolvedClientId
  };
};

const authenticateWithGoogle = async (
  config: SocialProviderRuntimeConfig,
  debug = false
): Promise<LoginSocialPayload> => {
  const redirectUri = resolveRedirectUri(config, "google");
  const scopes = config.scopes?.length ? config.scopes : ["openid", "profile", "email"];
  const request = new AuthSession.AuthRequest({
    clientId: config.resolvedClientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes,
    usePKCE: true,
    extraParams: {
      prompt: "select_account"
    }
  });
  logSocialDebug(debug, "google auth session start", { redirectUri });
  const result = await request.promptAsync(GOOGLE_DISCOVERY);
  if (result.type !== "success") {
    throw new Error("Google authentication cancelled.");
  }
  const code = result.params?.code;
  if (!code) {
    const errorDescription =
      result.params?.error_description || result.params?.error || "Google authentication did not return authorization code.";
    throw new Error(errorDescription);
  }

  const tokenResponse = await fetch(GOOGLE_DISCOVERY.tokenEndpoint!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: config.resolvedClientId,
      redirect_uri: redirectUri,
      code_verifier: request.codeVerifier ?? ""
    }).toString()
  });

  const tokenPayload = (await tokenResponse.json()) as {
    id_token?: string;
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenResponse.ok) {
    throw new Error(tokenPayload.error_description || tokenPayload.error || "Google token exchange failed.");
  }
  if (!tokenPayload.id_token) {
    throw new Error("Google token exchange did not return idToken.");
  }

  return {
    provider: "google",
    idToken: tokenPayload.id_token,
    accessToken: tokenPayload.access_token,
    redirectUri,
    codeVerifier: request.codeVerifier,
    clientId: config.resolvedClientId
  };
};

const authenticateWithFacebook = async (
  config: SocialProviderRuntimeConfig,
  debug = false
): Promise<LoginSocialPayload> => {
  const redirectUri = resolveRedirectUri(config, "facebook");

  const authUrl = buildFacebookAuthUrl(config);
  logSocialDebug(debug, "facebook auth session start", { redirectUri });
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  if (result.type !== "success" || !result.url) {
    throw new Error("Facebook authentication cancelled.");
  }

  const { queryParams, fragmentParams } = parseQueryAndFragment(result.url);
  const accessToken =
    queryParams.get("access_token") || fragmentParams.get("access_token");
  if (!accessToken) {
    throw new Error("Facebook authentication did not return accessToken.");
  }

  return {
    provider: "facebook",
    accessToken
  };
};

const authenticateWithFacebookNative = async (
  config: SocialProviderRuntimeConfig,
  debug = false
): Promise<LoginSocialPayload> => {
  let LoginManager: any;
  let AccessToken: any;
  let Settings: any;
  try {
    const facebookModule = require("react-native-fbsdk-next");
    LoginManager = facebookModule.LoginManager;
    AccessToken = facebookModule.AccessToken;
    Settings = facebookModule.Settings;
  } catch {
    throw new Error("Facebook native sdk not installed.");
  }

  if (!LoginManager?.logInWithPermissions || !AccessToken?.getCurrentAccessToken) {
    throw new Error("Facebook native sdk is unavailable.");
  }

  if (Settings?.setAppID) {
    Settings.setAppID(config.resolvedClientId);
  }
  if (config.clientToken?.trim() && Settings?.setClientToken) {
    Settings.setClientToken(config.clientToken.trim());
  }

  logSocialDebug(debug, "facebook native auth start", {
    platform: Platform.OS,
    loginTrackingIOS: Platform.OS === "ios" ? "enabled" : undefined,
  });
  let loginResult: any;
  try {
    loginResult =
      Platform.OS === "ios"
        ? await LoginManager.logInWithPermissions(
            ["public_profile", "email"],
            "enabled"
          )
        : await LoginManager.logInWithPermissions(["public_profile", "email"]);
    logSocialDebug(debug, "facebook native login result", {
      isCancelled: Boolean(loginResult?.isCancelled),
      grantedPermissions:
        Array.isArray(loginResult?.grantedPermissions)
          ? loginResult.grantedPermissions
          : undefined,
      declinedPermissions:
        Array.isArray(loginResult?.declinedPermissions)
          ? loginResult.declinedPermissions
          : undefined,
    });
  } catch (error) {
    logSocialDebug(debug, "facebook native login error", error);
    throw error;
  }
  if (loginResult?.isCancelled) {
    throw new Error("Facebook authentication cancelled.");
  }

  let tokenResult: any;
  try {
    tokenResult = await AccessToken.getCurrentAccessToken();
    logSocialDebug(debug, "facebook native access token result", {
      hasToken: Boolean(tokenResult?.accessToken),
      userID: tokenResult?.userID ?? tokenResult?.userId,
      expirationTime: tokenResult?.expirationTime,
    });
  } catch (error) {
    logSocialDebug(debug, "facebook native access token error", error);
    throw error;
  }
  const accessToken = tokenResult?.accessToken?.toString?.() ?? tokenResult?.accessToken;
  if (!accessToken) {
    logSocialDebug(debug, "facebook native access token missing");
    throw new Error("Facebook native authentication did not return accessToken.");
  }

  return {
    provider: "facebook",
    accessToken,
    clientId: config.resolvedClientId
  };
};

const authenticateWithApple = async (
  config: SocialProviderRuntimeConfig,
  debug = false
): Promise<LoginSocialPayload> => {
  try {
    const AppleAuthentication = require("expo-apple-authentication");
    if (!AppleAuthentication?.signInAsync) {
      throw new Error("AppleAuthentication module is not available.");
    }
    logSocialDebug(debug, "apple auth start");
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL
      ]
    });
    logSocialDebug(debug, "apple using idToken flow");

    return {
      provider: "apple",
      idToken: credential?.identityToken ?? undefined,
      clientId: config.resolvedClientId
    };
  } catch (error: any) {
    if (error?.code === "ERR_REQUEST_CANCELED") {
      throw new Error("Apple authentication cancelled.");
    }
    throw error;
  }
};

export const authenticateWithExpoSocialProvider = async (
  provider: JBSocialProviderName,
  config: JBAuthSocialConfig[JBSocialProviderName],
  debug = false,
  options?: AuthenticateWithProviderOptions
): Promise<LoginSocialPayload | null> => {
  const resolvedClientId =
    provider === "google"
      ? (
          (Platform.OS === "ios"
            ? (config as JBAuthSocialConfig["google"])?.iosClientId?.trim()
            : Platform.OS === "android"
              ? (config as JBAuthSocialConfig["google"])?.androidClientId?.trim()
              : undefined) ||
          config?.clientId?.trim() ||
          ""
        )
      : (config?.clientId?.trim() || "");

  if (provider === "apple" && Platform.OS !== "ios") {
    return null;
  }

  if (!config?.enabled || !resolvedClientId) {
    return null;
  }

  const runtimeConfig: SocialProviderRuntimeConfig = {
    ...config,
    provider,
    resolvedClientId
  };

  const providerMode = config?.mode;
  const strategyMode = options?.strategy?.defaultMode;
  const requestedPrimaryMode: JBSocialAuthMode = providerMode ?? strategyMode ?? "expo";
  const fallbackMode: JBSocialFallbackMode = options?.strategy?.fallbackMode ?? "expo";
  const isExpoGo = isExpoGoRuntime();

  if (provider === "facebook" && requestedPrimaryMode === "native" && isExpoGo) {
    logSocialDebug(debug, "facebook native auth unavailable in Expo Go");
    throw new Error("Facebook login requires a native build (Expo Go no es compatible).");
  }

  const primaryMode: JBSocialAuthMode =
    requestedPrimaryMode === "native" &&
    provider === "google" &&
    isExpoGo
      ? "expo"
      : requestedPrimaryMode;

  if (primaryMode !== requestedPrimaryMode) {
    logSocialDebug(
      debug,
      `${provider} native auth disabled in Expo Go, using expo auth flow`
    );
  }

  const withFallback = async (
    mode: JBSocialAuthMode,
    run: () => Promise<LoginSocialPayload>
  ): Promise<LoginSocialPayload> => {
    try {
      return await run();
    } catch (error) {
      const canFallbackToExpo =
        provider !== "facebook" &&
        mode === "native" &&
        fallbackMode === "expo";
      if (canFallbackToExpo) {
        logSocialDebug(debug, `${provider} native auth failed, falling back to expo`, error);
        return runWithMode("expo");
      }
      throw error;
    }
  };

  const runWithMode = async (mode: JBSocialAuthMode): Promise<LoginSocialPayload> => {
    if (provider === "google") {
      return withFallback(
        mode,
        mode === "native"
          ? () => authenticateWithGoogleNative(runtimeConfig, debug)
          : () => authenticateWithGoogle(runtimeConfig, debug)
      );
    }
    if (provider === "facebook") {
      return withFallback(
        mode,
        mode === "native"
          ? () => authenticateWithFacebookNative(runtimeConfig, debug)
          : () => authenticateWithFacebook(runtimeConfig, debug)
      );
    }
    if (provider === "apple") {
      return authenticateWithApple(runtimeConfig, debug);
    }
    throw new Error(`Unsupported social provider: ${provider}`);
  };

  return runWithMode(primaryMode);
};
