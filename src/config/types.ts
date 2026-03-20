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

export type JBAuthUserSettingsConfig = {
  enabled: boolean;
  routing: {
    homePathAfterProfileSwitch: string;
  };
  screens: {
    profiles: {
      enabled: boolean;
      allowSwitch: boolean;
      allowCreate: boolean;
    };
    changePassword: {
      enabled: boolean;
    };
    photo: {
      enabled: boolean;
      crop: {
        enabled: boolean;
        allowsEditing: boolean;
        aspect: [number, number];
      };
    };
    personalData: {
      enabled: boolean;
    };
  };
};

export type JBUIColorValue = string | (() => string);

export type JBUIColorModeValue = {
  light?: JBUIColorValue;
  dark?: JBUIColorValue;
  default?: JBUIColorValue;
};

export type JBUIColorConfig = JBUIColorValue | JBUIColorModeValue;

export type JBUIHeaderConfig = {
  backgroundColor?: JBUIColorConfig;
  tintColor?: JBUIColorConfig;
};

export type JBUITabsConfig = {
  backgroundColor?: JBUIColorConfig;
  borderTopColor?: JBUIColorConfig;
  activeTintColor?: JBUIColorConfig;
  inactiveTintColor?: JBUIColorConfig;
};

export type JBUISectionBackgroundConfig = {
  backgroundColor?: JBUIColorConfig;
};

export type JBUIFormsConfig = {
  backgroundColor?: JBUIColorConfig;
  textColor?: JBUIColorConfig;
  bottomSheetBackgroundColor?: JBUIColorConfig;
};

export type JBUISocialButtonsConfig = {
  backgroundColor?: JBUIColorConfig;
  borderColor?: JBUIColorConfig;
  textColor?: JBUIColorConfig;
  iconColor?: JBUIColorConfig;
};

export type JBUIButtonStyleConfig = {
  backgroundColor?: JBUIColorConfig;
  borderColor?: JBUIColorConfig;
  textColor?: JBUIColorConfig;
  iconColor?: JBUIColorConfig;
};

export type JBUIButtonVariantConfig = {
  solid?: JBUIButtonStyleConfig;
  outline?: JBUIButtonStyleConfig;
  link?: JBUIButtonStyleConfig;
};

export type JBUIButtonActionConfig = JBUIButtonStyleConfig &
  JBUIButtonVariantConfig;

export type JBUIButtonConfig = JBUIButtonActionConfig & {
  primary?: JBUIButtonActionConfig;
  secondary?: JBUIButtonActionConfig;
  positive?: JBUIButtonActionConfig;
  negative?: JBUIButtonActionConfig;
  default?: JBUIButtonActionConfig;
};

export type JBUIConfig = {
  header?: JBUIHeaderConfig;
  tabs?: JBUITabsConfig;
  main?: JBUISectionBackgroundConfig;
  card?: JBUISectionBackgroundConfig;
  footer?: JBUISectionBackgroundConfig;
  forms?: JBUIFormsConfig;
  socialButtons?: JBUISocialButtonsConfig;
  button?: JBUIButtonConfig;
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
    userSettings: JBAuthUserSettingsConfig;
    profileRoles: JBAuthProfileRoleOption[];
    defaultProfileRole?: string;
    social: JBAuthSocialConfig;
  };
  ui: JBUIConfig;
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
