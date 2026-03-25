import { defaultJBExpoConfig } from './defaults';
import { deepMerge } from './merge';
import {
  JBAuthAccountConfig,
  JBAuthRequiredProfileFields,
  JBAuthUserDebugConfig,
  JBApiHostConfig,
  JBAppConfig,
  JBAppConfigOverrides,
  JBAppStage,
  JBAppStageLowercase,
  JBSocialProviderName
} from './types';

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

  const providers: JBSocialProviderName[] = ['google', 'facebook', 'apple'];
  providers.forEach((providerName) => {
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

  const profileRoles = config.auth?.profileRoles ?? [];
  const defaultProfileRole = config.auth?.defaultProfileRole;
  if (defaultProfileRole && !profileRoles.some((roleOption) => roleOption.value === defaultProfileRole)) {
    throw new Error('[jb-expo-config] auth.defaultProfileRole must exist in auth.profileRoles.');
  }
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

export const getAuthRequiredProfileFields = (
  accountConfig?: Partial<JBAuthAccountConfig>
): JBAuthRequiredProfileFields => {
  const defaultRequiredProfileFields = defaultJBExpoConfig.auth.account.requiredProfileFields;
  const customRequiredProfileFields = (accountConfig?.requiredProfileFields ??
    {}) as Partial<JBAuthRequiredProfileFields>;

  return {
    ...defaultRequiredProfileFields,
    ...customRequiredProfileFields
  };
};

export const getAuthAccountConfig = (config: JBAppConfig): JBAuthAccountConfig => {
  const accountConfig = config.auth?.account ?? defaultJBExpoConfig.auth.account;
  const requiredProfileFields = getAuthRequiredProfileFields(accountConfig);

  return {
    ...defaultJBExpoConfig.auth.account,
    ...accountConfig,
    requiredProfileFields,
    menu: {
      ...defaultJBExpoConfig.auth.account.menu,
      ...(accountConfig.menu ?? {}),
      overrides: {
        ...(defaultJBExpoConfig.auth.account.menu.overrides ?? {}),
        ...(accountConfig.menu?.overrides ?? {})
      },
      confirmations: {
        ...(defaultJBExpoConfig.auth.account.menu.confirmations ?? {}),
        ...(accountConfig.menu?.confirmations ?? {})
      }
    }
  };
};

export const getAuthUserDebugConfig = (config: JBAppConfig): JBAuthUserDebugConfig => {
  const userDebug = config.auth?.userDebug ?? defaultJBExpoConfig.auth.userDebug;
  return {
    ...defaultJBExpoConfig.auth.userDebug,
    ...(userDebug ?? {}),
    signUp: {
      ...(defaultJBExpoConfig.auth.userDebug.signUp ?? {}),
      ...(userDebug?.signUp ?? {})
    }
  };
};
