import { defaultJBExpoConfig } from './defaults';
import { deepMerge } from './merge';
import { JBApiHostConfig, JBAppConfig, JBAppConfigOverrides, JBAppStage, JBAppStageLowercase, JBSocialProviderName } from './types';

let lastCreatedJBExpoConfig: JBAppConfig = defaultJBExpoConfig;

const resolveApiHostByStage = (hostConfig: JBApiHostConfig, stage: JBAppStage): string => {
  const uppercaseValue = hostConfig[stage];
  if (uppercaseValue) {
    return uppercaseValue;
  }

  const lowercaseValue = hostConfig[stage.toLowerCase() as JBAppStageLowercase];
  if (lowercaseValue) {
    return lowercaseValue;
  }

  const fallback =
    hostConfig.QA ??
    hostConfig.qa ??
    hostConfig.DEVELOPMENT ??
    hostConfig.development ??
    hostConfig.LOCAL ??
    hostConfig.local ??
    hostConfig.PRODUCTION ??
    hostConfig.production;

  if (!fallback) {
    throw new Error('[jb-expo-config] api.host has no resolvable value for current stage.');
  }

  return fallback;
};

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');
const hasAnyGoogleClientId = (providerConfig: {
  clientId?: string;
  iosClientId?: string;
  androidClientId?: string;
}): boolean =>
  Boolean(
    providerConfig.clientId?.trim() ||
    providerConfig.iosClientId?.trim() ||
    providerConfig.androidClientId?.trim()
  );

const validateSocialConfig = (config: JBAppConfig) => {
  const minimumSignUpAge = config.auth?.signUp?.minimumAge;
  if (!Number.isInteger(minimumSignUpAge) || minimumSignUpAge < 0) {
    throw new Error('[jb-expo-config] auth.signUp.minimumAge must be a non-negative integer.');
  }

  const socialConfig = config.auth?.social;
  if (!socialConfig) {
    return;
  }

  (Object.keys(socialConfig) as JBSocialProviderName[]).forEach((providerName) => {
    const providerConfig = socialConfig[providerName];
    if (
      providerName === 'google' &&
      providerConfig?.enabled &&
      !hasAnyGoogleClientId(providerConfig as { clientId?: string; iosClientId?: string; androidClientId?: string })
    ) {
      throw new Error(
        `[jb-expo-config] auth.social.google requires at least one client id (clientId, iosClientId or androidClientId) when enabled=true.`
      );
    }
    if (providerName !== 'google' && providerConfig?.enabled && !providerConfig.clientId?.trim()) {
      throw new Error(`[jb-expo-config] auth.social.${providerName}.clientId is required when enabled=true.`);
    }
  });
};

export const createJBExpoConfig = (
  baseConfig?: JBAppConfigOverrides,
  overrides?: JBAppConfigOverrides
): JBAppConfig => {
  const withBase = deepMerge(
    defaultJBExpoConfig as unknown as Record<string, unknown>,
    baseConfig as Record<string, unknown> | undefined
  );

  const resolved = deepMerge(
    withBase,
    overrides as Record<string, unknown> | undefined
  ) as unknown as JBAppConfig;

  validateSocialConfig(resolved);
  lastCreatedJBExpoConfig = resolved;
  return resolved;
};

export const getLastCreatedJBExpoConfig = (): JBAppConfig => lastCreatedJBExpoConfig;

export const getApiBaseUrl = (config: JBAppConfig): string => {
  const host = resolveApiHostByStage(config.api.host, config.stage);
  return trimTrailingSlashes(host);
};

export const getApiUrl = (config: JBAppConfig): string => {
  const baseUrl = getApiBaseUrl(config);
  const version = config.api.version?.trim();
  if (!version) {
    return baseUrl;
  }

  return `${baseUrl}/${version.replace(/^\/+/, '')}`;
};

export const getAuthBasePath = (config: JBAppConfig): string => {
  return config.auth?.apiBasePath || '/authentication';
};
