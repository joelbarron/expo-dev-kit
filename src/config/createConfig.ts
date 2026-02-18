import { defaultJBExpoConfig } from './defaults';
import { deepMerge } from './merge';
import { JBApiHostConfig, JBAppConfig, JBAppConfigOverrides, JBAppStage, JBAppStageLowercase } from './types';

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
