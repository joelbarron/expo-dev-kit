import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import { LoginSocialPayload } from "../types";
import { JBAuthSocialConfig, JBSocialProviderName } from "../../config";

type SocialProviderRuntimeConfig = JBAuthSocialConfig[JBSocialProviderName] & {
  provider: JBSocialProviderName;
  resolvedClientId: string;
};

const logSocialDebug = (enabled: boolean, message: string, payload?: unknown) => {
  if (!enabled) {
    return;
  }
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

const resolveRedirectUri = (
  config: SocialProviderRuntimeConfig,
  provider: "google" | "facebook"
): string => {
  const configured = config.redirectUri?.trim();
  if (configured) {
    return configured;
  }
  return Linking.createURL(`auth/${provider}`);
};

const buildGoogleAuthUrl = (config: SocialProviderRuntimeConfig) => {
  const redirectUri = resolveRedirectUri(config, "google");
  const scopes = config.scopes?.length ? config.scopes : ["openid", "profile", "email"];
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const params = new URLSearchParams({
    client_id: config.resolvedClientId,
    redirect_uri: redirectUri,
    response_type: "id_token",
    scope: scopes.join(" "),
    nonce,
    prompt: "select_account"
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
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

const authenticateWithGoogle = async (
  config: SocialProviderRuntimeConfig,
  debug = false
): Promise<LoginSocialPayload> => {
  const redirectUri = resolveRedirectUri(config, "google");

  const authUrl = buildGoogleAuthUrl(config);
  logSocialDebug(debug, "google auth session start", { redirectUri });
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  if (result.type !== "success" || !result.url) {
    throw new Error("Google authentication cancelled.");
  }

  const { queryParams, fragmentParams } = parseQueryAndFragment(result.url);
  const idToken = queryParams.get("id_token") || fragmentParams.get("id_token");
  if (!idToken) {
    throw new Error("Google authentication did not return idToken.");
  }

  return {
    provider: "google",
    idToken
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

    return {
      provider: "apple",
      idToken: credential?.identityToken ?? undefined,
      code: credential?.authorizationCode ?? undefined
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
  debug = false
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

  if (provider === "google") {
    return authenticateWithGoogle(runtimeConfig, debug);
  }
  if (provider === "facebook") {
    return authenticateWithFacebook(runtimeConfig, debug);
  }
  if (provider === "apple") {
    return authenticateWithApple(runtimeConfig, debug);
  }

  return null;
};
