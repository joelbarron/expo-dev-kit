import { AxiosRequestConfig } from 'axios';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type TokenStorage = {
  getAccessToken: () => Promise<string | null>;
  setAccessToken: (token: string) => Promise<void>;
  removeAccessToken: () => Promise<void>;
  getRefreshToken: () => Promise<string | null>;
  setRefreshToken: (token: string) => Promise<void>;
  removeRefreshToken: () => Promise<void>;
};

export type CreateAuthenticatedAxiosOptions = {
  requestConfig?: AxiosRequestConfig;
};

export type JbDrfAuthEndpoints = {
  loginBasic: string;
  loginSocial: string;
  loginSocialPrecheck: string;
  loginSocialLink: string;
  loginSocialUnlink: string;
  loginOtpVerify: string;
  otpRequest: string;
  register: string;
  accountConfirmation: string;
  accountConfirmationResend: string;
  me: string;
  refresh: string;
  switchProfile: string;
  profiles: string;
  passwordResetRequest: string;
  passwordResetConfirm: string;
  passwordResetChange: string;
};

export type JbDrfAuthConfig = {
  apiBaseUrl: string;
  apiBasePath?: string;
  endpoints?: Partial<JbDrfAuthEndpoints>;
  defaultClient?: 'web' | 'mobile';
  tokenStorage?: TokenStorage;
  onUnauthorized?: () => void;
};

export type JbDrfWebAuthResponse = {
  user?: unknown;
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

export type ApiDetailResponse = Record<string, unknown> & {
  detail?: string;
  emailSent?: boolean;
};

export type LoginBasicPayload = {
  login: string;
  password: string;
  client?: 'web' | 'mobile';
  device?: unknown;
};

export type LoginSocialPayload = {
  provider: string;
  idToken?: string;
  accessToken?: string;
  code?: string;
  client?: 'web' | 'mobile';
  device?: unknown;
};

export type LoginSocialPrecheckResponse = {
  shouldLink?: boolean;
  providerExists?: boolean;
  email?: string;
};

export type LinkSocialPayload = {
  provider: string;
  code?: string;
  idToken?: string;
  accessToken?: string;
};

export type UnlinkSocialPayload = {
  provider: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  passwordConfirm?: string;
  firstName?: string;
  lastName1?: string;
  lastName2?: string;
  username?: string | null;
  birthday?: string;
  gender?: string;
  termsAndConditionsAccepted?: boolean;
  role?: string;
};

export type AccountConfirmationPayload = {
  uid: string;
  token: string;
};

export type AccountConfirmationResendPayload = {
  email: string;
};

export type RequestOtpPayload = {
  login?: string;
  phone?: string;
  channel?: 'email' | 'sms';
};

export type VerifyOtpPayload = {
  login?: string;
  phone?: string;
  otp?: string;
  code?: string;
  channel?: 'email' | 'sms';
  role?: string;
  client?: 'web' | 'mobile';
  device?: unknown;
};

export type PasswordResetRequestPayload = {
  email: string;
};

export type PasswordResetConfirmPayload = {
  uid: string;
  token: string;
  password?: string;
  newPassword?: string;
  newPasswordConfirm?: string;
};

export type PasswordChangePayload = {
  oldPassword?: string;
  password: string;
};

export type ProfilesResponse = {
  count?: number;
  results?: Array<Record<string, unknown>>;
} & Record<string, unknown>;

export type SwitchProfilePayload = {
  profile: number | string;
  client?: 'web' | 'mobile';
  device?: unknown;
};

export type RefreshPayload = {
  refreshToken?: string;
};
