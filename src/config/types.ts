export type JBAppStage = 'PRODUCTION' | 'QA' | 'DEVELOPMENT' | 'LOCAL';
export type JBAppStageLowercase = Lowercase<JBAppStage>;

export type JBApiHostConfig = Partial<Record<JBAppStage, string>> &
  Partial<Record<JBAppStageLowercase, string>>;

export type JBStripePublishableKeyConfig =
  | string
  | (Partial<Record<JBAppStage, string>> &
      Partial<Record<JBAppStageLowercase, string>>);

export type JBStripeConfig = {
  enabled?: boolean;
  useStripe?: boolean;
  publishableKey?: JBStripePublishableKeyConfig;
  merchantIdentifier?: string;
  urlScheme?: string;
  setReturnUrlSchemeOnAndroid?: boolean;
};

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

export type JBAuthProfileFieldKey =
  | 'firstName'
  | 'lastName1'
  | 'lastName2'
  | 'birthday'
  | 'gender'
  | 'label';

export type JBAuthRequiredProfileFields = Record<JBAuthProfileFieldKey, boolean>;

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

export type JBAuthWelcomeConfig = {
  allowGuestExplore: boolean;
  guestExploreLabel: string;
};

export type JBAuthRoutesConfig = {
  welcome?: string;
  authEntry?: string;
  signInPassword?: string;
  signInOtp?: string;
  signUpForm?: string;
  forgotPassword?: string;
  resetPassword?: string;
  verifyEmail?: string;
  signOut?: string;
  signedIn?: string;
  guestExplore?: string;
  userBasePath?: string;
  accountDataPath?: string;
  accountSecurityPath?: string;
  profilePhotoPath?: string;
  profilesPath?: string;
  paymentMethodsPath?: string;
  profileCompletionPath?: string;
};

export type JBButtonAction =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'positive'
  | 'negative';

export type JBButtonVariant = 'solid' | 'outline' | 'link';
export type JBButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type JBAuthFooterButtonConfig = {
  action?: JBButtonAction;
  variant?: JBButtonVariant;
  size?: JBButtonSize;
  className?: string;
  textClassName?: string;
};

export type JBAuthFooterButtonsConfig = {
  primary?: JBAuthFooterButtonConfig;
  secondary?: JBAuthFooterButtonConfig;
};

export type JBAuthAccountScreensConfig = {
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

export type JBAuthAccountMenuItemId =
  | 'security'
  | 'paymentMethods'
  | 'settings'
  | 'signOut'
  | 'notifications';

export type JBAuthDialogActionColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'positive'
  | 'negative';

export type JBAuthAccountMenuItemConfirmation = {
  title?: string;
  content?: string;
  agreeText?: string;
  agreeColor?: JBAuthDialogActionColor;
  disagreeText?: string;
  disagreeColor?: JBAuthDialogActionColor;
};

export type JBAuthAccountMenuItemOverride = {
  title?: string;
  subtitle?: string;
  iconName?: string;
  href?: string;
  visible?: boolean;
  confirmation?: JBAuthAccountMenuItemConfirmation;
};

export type JBAuthAccountMenuConfig = {
  include?: JBAuthAccountMenuItemId[];
  order?: JBAuthAccountMenuItemId[];
  overrides?: Partial<Record<JBAuthAccountMenuItemId, JBAuthAccountMenuItemOverride>>;
  confirmations?: Partial<Record<JBAuthAccountMenuItemId, JBAuthAccountMenuItemConfirmation>>;
};

export type JBAuthAccountProfileMirrorConfig = {
  enabled: boolean;
  rolePairs: Array<[string, string]>;
  syncFields: string[];
  autocureOnAuthEvents: boolean;
};

export type JBAuthProfileCompletionMode = 'enforced' | 'suggested';

export type JBAuthAccountConfig = {
  allowDefaultProfileEdit: boolean;
  enableContactVerification: boolean;
  ensureProfileCompletion: boolean;
  profileCompletionMode: JBAuthProfileCompletionMode;
  profileCompletionPath?: string;
  requiredProfileFields: JBAuthRequiredProfileFields;
  subscriptionUrl?: string;
  menu: JBAuthAccountMenuConfig;
  profileMirror: JBAuthAccountProfileMirrorConfig;
};

export type JBAuthUserDebugConfig = {
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

export type JBUIColorValue = string | (() => string);

export type JBUIColorModeValue = {
  light?: JBUIColorValue;
  dark?: JBUIColorValue;
  default?: JBUIColorValue;
};

export type JBUIColorConfig = JBUIColorValue | JBUIColorModeValue;

export type JBUIHeaderMode = 'native' | 'custom';
export type JBUIHeaderTitleAlign = 'left' | 'center';
export type JBUIHeaderBackIconConfig =
  | string
  | {
      ios?: string;
      android?: string;
      default?: string;
    };

export type JBUIHeaderConfig = {
  mode?: JBUIHeaderMode;
  minContentHeight?: number;
  backIcon?: JBUIHeaderBackIconConfig;
  titleAlign?: JBUIHeaderTitleAlign;
  paddingHorizontal?: number;
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

export type JBUIAuthConfig = {
  socialButtons?: JBUISocialButtonsConfig;
  footerButtons?: JBAuthFooterButtonsConfig;
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

export type JBUIChipStateConfig = {
  backgroundColor?: JBUIColorConfig;
  borderColor?: JBUIColorConfig;
  textColor?: JBUIColorConfig;
};

export type JBUIChipConfig = {
  active?: JBUIChipStateConfig;
  inactive?: JBUIChipStateConfig;
};

export type JBUIThemeOverrides = {
  light?: Record<string, string>;
  dark?: Record<string, string>;
};

export type JBUIConfig = {
  header?: JBUIHeaderConfig;
  tabs?: JBUITabsConfig;
  main?: JBUISectionBackgroundConfig;
  card?: JBUISectionBackgroundConfig;
  footer?: JBUISectionBackgroundConfig;
  forms?: JBUIFormsConfig;
  auth?: JBUIAuthConfig;
  // Deprecated: use ui.auth.socialButtons
  socialButtons?: JBUISocialButtonsConfig;
  button?: JBUIButtonConfig;
  chip?: JBUIChipConfig;
  // CSS-var color tokens injected at runtime by the GluestackUIProvider.
  // Use the `--color-typography-X` / `--color-background-X` etc. naming.
  themeOverrides?: JBUIThemeOverrides;
};

export type JBPermissionKey =
  | 'location'
  | 'notifications'
  | 'camera'
  | 'media_library';

export type JBPermissionsGuardConfig = {
  enabled?: boolean;
  setupPath?: string;
  authenticatedOnly?: boolean;
  mode?: 'strict' | 'remindable';
  remindAfterHours?: number;
};

export type JBPermissionsConfig = {
  required?: JBPermissionKey[];
  optional?: JBPermissionKey[];
  guard?: JBPermissionsGuardConfig;
};

export type JBSettingsVersionConfig = {
  iosStoreUrl?: string;
  androidStoreUrl?: string;
};

export type JBSettingsSecurityConfig = {
  biometricsEnabled?: boolean;
  biometricsPath?: string;
  biometricsPromptOnLogin?: boolean;
  biometricsLockMode?:
    | 'on_app_open'
    | 'every_foreground'
    | 'foreground_timeout';
  biometricsLockTimeoutSeconds?: number;
  allowDeviceCredentialFallback?: boolean;
};

export type JBSettingsConfig = {
  routes?: JBSettingsRoutesConfig;
  notifications?: JBSettingsNotificationsConfig;
  version?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
  } & JBSettingsVersionConfig;
  permissions?: {
    enabled?: boolean;
    path?: string;
  };
  appearance?: {
    enabled?: boolean;
    defaultMode?: 'light' | 'dark' | 'system';
  };
  security?: JBSettingsSecurityConfig;
};

export type JBSettingsNotificationsLocalRemindersConfig = {
  enabled?: boolean;
  mode?: 'manual' | 'on_app_open' | 'on_foreground';
  source?: string;
  reservationStartOffsetMinutes?: number;
  checkoutOffsetMinutes?: number;
  activeStatuses?: string[];
};

export type JBSettingsNotificationsConfig = {
  enabled?: boolean;
  path?: string;
  enablePushListeners?: boolean;
  autoSyncPushToken?: boolean;
  pushTokenSyncPath?: string;
  localReminders?: JBSettingsNotificationsLocalRemindersConfig;
};

export type JBSettingsRoutesConfig = {
  root?: string;
  notifications?: string;
  permissions?: string;
  security?: string;
};

export type JBOfflineMode =
  | 'blocking_with_offline'
  | 'strict_blocking'
  | 'banner_only';

export type JBOfflineConfig = {
  mode?: JBOfflineMode;
};

export type JBAppStatusStrategy = 'hybrid' | 'store' | 'remote';

export type JBAppStatusConfig = {
  strategy?: JBAppStatusStrategy;
  enforceUpdateInProductionOnly?: boolean;
  blockOnStoreMandatoryUpdate?: boolean;
  blockOnRemoteOutdated?: boolean;
  updateUrl?: string;
} & JBSettingsVersionConfig;

export type JBAnnouncementsAutoOpenMode = "first_install_and_new_campaign";

export type JBAnnouncementsExternalOpenMode = "in_app_browser";

export type JBAnnouncementsConfig = {
  enabled?: boolean;
  endpointPath?: string;
  routePath?: string;
  autoOpenMode?: JBAnnouncementsAutoOpenMode;
  openAfterRoutes?: {
    guest?: string;
    authenticated?: string;
  };
  externalOpenMode?: JBAnnouncementsExternalOpenMode;
};

export type JBLoadingFallbackConfig = {
  logoSource?: number | { uri: string };
  logoWidth?: number;
  logoHeight?: number;
  title?: string;
  subtitle?: string;
  showIndicator?: boolean;
  backgroundColor?: JBUIColorConfig;
  textColor?: JBUIColorConfig;
  indicatorColor?: JBUIColorConfig;
};

export type JBRuntimeConfig = {
  offline?: JBOfflineConfig;
  appStatus?: JBAppStatusConfig;
  announcements?: JBAnnouncementsConfig;
  loading?: JBLoadingFallbackConfig;
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
  stripe?: JBStripeConfig;
  settings?: JBSettingsConfig;
  permissions?: JBPermissionsConfig;
  runtime?: JBRuntimeConfig;
  navigation?: Record<string, unknown>;
  auth: {
    apiBasePath: string;
    routes?: JBAuthRoutesConfig;
    showDebugSocial: boolean;
    signUp: {
      minimumAge: number;
    };
    visuals: {
      verifyEmail: JBAuthVerifyEmailVisualConfig;
    };
    welcome: JBAuthWelcomeConfig;
    // Deprecated: use ui.auth.footerButtons
    footerButtons?: JBAuthFooterButtonsConfig;
    accountScreens: JBAuthAccountScreensConfig;
    account: JBAuthAccountConfig;
    profileRoles: JBAuthProfileRoleOption[];
    defaultProfileRole?: string;
    userDebug: JBAuthUserDebugConfig;
    social: JBAuthSocialConfig;
  };
  ui: JBUIConfig;
};

type JBDeepPartial<T> = T extends Array<infer U>
  ? Array<JBDeepPartial<U>>
  : T extends object
    ? { [K in keyof T]?: JBDeepPartial<T[K]> }
    : T;

export type JBAppConfigOverrides = JBDeepPartial<JBAppConfig>;
