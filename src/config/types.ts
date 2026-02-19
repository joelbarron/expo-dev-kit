export type JBAppStage = 'PRODUCTION' | 'QA' | 'DEVELOPMENT' | 'LOCAL';
export type JBAppStageLowercase = Lowercase<JBAppStage>;

export type JBApiHostConfig = Partial<Record<JBAppStage, string>> &
  Partial<Record<JBAppStageLowercase, string>>;

export type JBSocialProviderName = 'google' | 'facebook' | 'apple';

export type JBSocialProviderConfig = {
  enabled: boolean;
  clientId?: string;
  redirectUri?: string;
  scopes?: string[];
};

export type JBGoogleSocialProviderConfig = JBSocialProviderConfig & {
  iosClientId?: string;
  androidClientId?: string;
};

export type JBAuthSocialConfig = {
  google: JBGoogleSocialProviderConfig;
  facebook: JBSocialProviderConfig;
  apple: JBSocialProviderConfig;
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
