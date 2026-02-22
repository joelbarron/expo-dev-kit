export type JBAppStage = 'PRODUCTION' | 'QA' | 'DEVELOPMENT' | 'LOCAL';
export type JBAppStageLowercase = Lowercase<JBAppStage>;

export type JBApiHostConfig = Partial<Record<JBAppStage, string>> &
  Partial<Record<JBAppStageLowercase, string>>;

export type JBSocialProviderName = 'google' | 'facebook' | 'apple';
export type JBSocialAuthMode = 'native' | 'expo';
export type JBSocialFallbackMode = 'expo' | 'none';

export type JBSocialProviderConfig = {
  enabled: boolean;
  mode?: JBSocialAuthMode;
  clientId?: string;
  clientToken?: string;
  redirectUri?: string;
  scopes?: string[];
};

export type JBGoogleSocialProviderConfig = JBSocialProviderConfig & {
  iosClientId?: string;
  androidClientId?: string;
};

export type JBAuthSocialConfig = {
  strategy: {
    defaultMode: JBSocialAuthMode;
    fallbackMode: JBSocialFallbackMode;
  };
  google: JBGoogleSocialProviderConfig;
  facebook: JBSocialProviderConfig;
  apple: JBSocialProviderConfig;
};

export type JBAuthProfileRoleOption = {
  value: string;
  label: string;
  allowSignup?: boolean;
};

export type JBLottieSource = Record<string, unknown> | string | { uri: string };

export type JBAuthVerifyEmailVisualConfig = {
  showAnimation: boolean;
  pendingAnimationSource?: JBLottieSource;
  successAnimationSource?: JBLottieSource;
  animationSource?: JBLottieSource;
  animationAutoPlay?: boolean;
  animationLoop?: boolean;
  successAnimationLoop?: boolean;
  animationSpeed?: number;
  animationSize?: number;
};

export type JBAppConfig = {
  debug: boolean;
  forceHideStage: boolean;
  stage: JBAppStage;
  defaultRows: number;
  maxRows: number;
  momentLocale: string;
  defaultLocaleDate: string;
  dateFormat: string;
  dateTimeFormat: string;
  defaultFormatDateAPI: string;
  api: {
    version: string;
    host: JBApiHostConfig;
  };
  auth: {
    apiBasePath: string;
    showDebugSocial: boolean;
    signUp: {
      minimumAge: number;
    };
    visuals: {
      verifyEmail: JBAuthVerifyEmailVisualConfig;
    };
    profileRoles: JBAuthProfileRoleOption[];
    defaultProfileRole?: string;
    social: JBAuthSocialConfig;
  };
  userDebug: {
    login: string;
    password: string;
    signUp?: {
      firstName?: string;
      lastName1?: string;
      lastName2?: string;
      email?: string;
      birthday?: string;
      gender?: string;
      role?: string;
      password?: string;
      passwordConfirm?: string;
      acceptTermsConditions?: boolean;
    };
  };
};

type JBDeepPartial<T> = T extends Array<infer U>
  ? Array<JBDeepPartial<U>>
  : T extends object
    ? { [K in keyof T]?: JBDeepPartial<T[K]> }
    : T;

export type JBAppConfigOverrides = JBDeepPartial<JBAppConfig>;
