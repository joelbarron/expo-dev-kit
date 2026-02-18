import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { JBAppConfig, getApiUrl, getAuthBasePath } from '../config';
import { createSecureStoreTokenStorage } from './storage';
import {
  AccountConfirmationPayload,
  AccountConfirmationResendPayload,
  ApiDetailResponse,
  CreateAuthenticatedAxiosOptions,
  JbDrfAuthConfig,
  JbDrfAuthEndpoints,
  JbDrfWebAuthResponse,
  LinkSocialPayload,
  LoginBasicPayload,
  LoginSocialPayload,
  LoginSocialPrecheckResponse,
  PasswordChangePayload,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  ProfilesResponse,
  RefreshPayload,
  RegisterPayload,
  RequestOtpPayload,
  SwitchProfilePayload,
  TokenPair,
  TokenStorage,
  UnlinkSocialPayload,
  VerifyOtpPayload
} from './types';

const normalizeAuthBasePath = (basePath?: string) => {
  const normalized = (basePath ?? '/authentication').trim();
  if (!normalized) {
    return '/authentication';
  }
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return withLeadingSlash.replace(/\/+$/, '');
};

export const createAuthEndpoints = (basePath?: string): JbDrfAuthEndpoints => {
  const root = normalizeAuthBasePath(basePath);

  return {
    loginBasic: `${root}/login/basic/`,
    loginSocial: `${root}/login/social/`,
    loginSocialPrecheck: `${root}/login/social/precheck/`,
    loginSocialLink: `${root}/login/social/link/`,
    loginSocialUnlink: `${root}/login/social/unlink/`,
    loginOtpVerify: `${root}/otp/verify/`,
    otpRequest: `${root}/otp/request/`,
    register: `${root}/register/`,
    accountConfirmation: `${root}/registration/account-confirmation-email/`,
    accountConfirmationResend: `${root}/registration/account-confirmation-email/resend/`,
    me: `${root}/me/?client=mobile`,
    refresh: `${root}/token/refresh/`,
    switchProfile: `${root}/profile/switch/`,
    profiles: `${root}/profiles/`,
    passwordResetRequest: `${root}/password-reset/request/`,
    passwordResetConfirm: `${root}/password-reset/confirm/`,
    passwordResetChange: `${root}/password-reset/change/`
  };
};

export const defaultAuthEndpoints: JbDrfAuthEndpoints = createAuthEndpoints('/authentication');

type RefreshResponsePayload = {
  accessToken?: string;
  refreshToken?: string;
  access?: string;
  refresh?: string;
};

const getRefreshTokenFromResponse = (
  response: AxiosResponse<RefreshResponsePayload>
): TokenPair => ({
  accessToken: response.data.accessToken ?? response.data.access ?? '',
  refreshToken: response.data.refreshToken ?? response.data.refresh ?? ''
});

const normalizeBaseUrl = (apiBaseUrl: string) => apiBaseUrl.replace(/\/+$/, '');

const normalizeDetailResponse = (data: Record<string, unknown>): ApiDetailResponse => ({
  ...data,
  emailSent: (data.emailSent as boolean | undefined) ?? (data.email_sent as boolean | undefined)
});

const withClientPayload = <TPayload extends { client?: 'web' | 'mobile'; device?: unknown }>(
  payload: TPayload,
  defaultClient: 'web' | 'mobile'
) => {
  const client = payload.client ?? defaultClient;
  if (client === 'web') {
    const { device: _device, ...rest } = payload;
    return { ...rest, client };
  }

  return { ...payload, client };
};

export type AuthClient = {
  endpoints: JbDrfAuthEndpoints;
  tokenStorage: TokenStorage;
  getAccessToken: () => Promise<string | null>;
  setAccessToken: (token: string) => Promise<void>;
  clearSession: () => Promise<void>;
  createPublicAxios: () => AxiosInstance;
  createAuthenticatedAxios: (options?: CreateAuthenticatedAxiosOptions) => AxiosInstance;
  createAuthenticatedAxiosWithRefresh: (options?: CreateAuthenticatedAxiosOptions) => AxiosInstance;
  loginBasic: (payload: LoginBasicPayload) => Promise<JbDrfWebAuthResponse>;
  loginSocial: (payload: LoginSocialPayload) => Promise<JbDrfWebAuthResponse>;
  loginSocialPrecheck: (payload: LoginSocialPayload) => Promise<LoginSocialPrecheckResponse>;
  linkSocial: (payload: LinkSocialPayload) => Promise<Record<string, unknown>>;
  unlinkSocial: (payload: UnlinkSocialPayload) => Promise<Record<string, unknown>>;
  requestOtp: (payload: RequestOtpPayload) => Promise<Record<string, unknown>>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<JbDrfWebAuthResponse>;
  register: (payload: RegisterPayload) => Promise<ApiDetailResponse>;
  confirmAccountEmail: (payload: AccountConfirmationPayload) => Promise<ApiDetailResponse>;
  resendAccountConfirmation: (payload: AccountConfirmationResendPayload) => Promise<ApiDetailResponse>;
  getMe: () => Promise<JbDrfWebAuthResponse>;
  getProfiles: () => Promise<ProfilesResponse>;
  requestPasswordReset: (payload: PasswordResetRequestPayload) => Promise<Record<string, unknown>>;
  confirmPasswordReset: (payload: PasswordResetConfirmPayload) => Promise<Record<string, unknown>>;
  changePassword: (payload: PasswordChangePayload) => Promise<Record<string, unknown>>;
  refreshToken: (payload?: RefreshPayload) => Promise<TokenPair>;
  switchProfile: (payload: SwitchProfilePayload) => Promise<JbDrfWebAuthResponse>;
  logout: () => Promise<void>;
};

export const createAuthClient = (config: JbDrfAuthConfig): AuthClient => {
  const endpoints: JbDrfAuthEndpoints = {
    ...createAuthEndpoints(config.apiBasePath),
    ...(config.endpoints ?? {})
  };

  const tokenStorage = config.tokenStorage ?? createSecureStoreTokenStorage();
  const baseUrl = normalizeBaseUrl(config.apiBaseUrl);
  const defaultClient = config.defaultClient ?? 'mobile';

  const withBaseUrl = (path: string) => `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const getAccessToken = () => tokenStorage.getAccessToken();
  const setAccessToken = (token: string) => tokenStorage.setAccessToken(token);
  const clearSession = () => tokenStorage.removeAccessToken();
  let refreshPromise: Promise<string | null> | null = null;

  const saveRefreshToken = async (token?: string | null) => {
    if (!token) {
      return;
    }
    await tokenStorage.setRefreshToken(token);
  };

  const getStoredRefreshToken = () => tokenStorage.getRefreshToken();

  const clearStoredRefreshToken = () => tokenStorage.removeRefreshToken();

  const createPublicAxios = () =>
    axios.create({
      baseURL: baseUrl
    });

  const createAuthenticatedAxios = (options?: CreateAuthenticatedAxiosOptions) => {
    const instance = axios.create({
      baseURL: baseUrl,
      ...(options?.requestConfig ?? {})
    });

    instance.interceptors.request.use(async (requestConfig) => {
      const token = await getAccessToken();
      if (token) {
        const headers = (requestConfig.headers ?? {}) as any;
        headers.Authorization = `Bearer ${token}`;
        requestConfig.headers = headers;
      }
      return requestConfig;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401 &&
          typeof config.onUnauthorized === 'function'
        ) {
          config.onUnauthorized();
        }
        return Promise.reject(error);
      }
    );

    return instance;
  };

  const refreshToken = async (payload?: RefreshPayload): Promise<TokenPair> => {
    const refreshTokenValue = payload?.refreshToken ?? (await getStoredRefreshToken());
    if (!refreshTokenValue) {
      return {
        accessToken: '',
        refreshToken: ''
      };
    }

    const response = await createPublicAxios().post<RefreshResponsePayload>(withBaseUrl(endpoints.refresh), {
      refresh: refreshTokenValue
    });

    const nextTokens = getRefreshTokenFromResponse(response);
    if (nextTokens.accessToken) {
      await setAccessToken(nextTokens.accessToken);
    }
    await saveRefreshToken(nextTokens.refreshToken);

    return nextTokens;
  };

  const createAuthenticatedAxiosWithRefresh = (options?: CreateAuthenticatedAxiosOptions) => {
    const instance = createAuthenticatedAxios(options);

    instance.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        if (!axios.isAxiosError(error)) {
          return Promise.reject(error);
        }

        const originalRequest = error.config as
          | (typeof error.config & { _retry?: boolean })
          | undefined;

        if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          if (!refreshPromise) {
            refreshPromise = (async () => {
              const refreshTokenFromStorage = await getStoredRefreshToken();
              if (!refreshTokenFromStorage) {
                return null;
              }

              const nextTokens = await refreshToken({ refreshToken: refreshTokenFromStorage });
              await saveRefreshToken(nextTokens.refreshToken);
              return nextTokens.accessToken || null;
            })().finally(() => {
              refreshPromise = null;
            });
          }

          const nextAccessToken = await refreshPromise;
          if (!nextAccessToken) {
            return Promise.reject(error);
          }

          await setAccessToken(nextAccessToken);
          const headers = (originalRequest.headers ?? {}) as any;
          headers.Authorization = `Bearer ${nextAccessToken}`;
          originalRequest.headers = headers;

          return instance(originalRequest);
        } catch (refreshError) {
          if (typeof config.onUnauthorized === 'function') {
            config.onUnauthorized();
          }
          return Promise.reject(refreshError);
        }
      }
    );

    return instance;
  };

  const loginBasic = async (payload: LoginBasicPayload): Promise<JbDrfWebAuthResponse> => {
    const response = await createPublicAxios().post<JbDrfWebAuthResponse>(withBaseUrl(endpoints.loginBasic), {
      ...withClientPayload(payload, defaultClient)
    });

    const accessToken = response.data.tokens?.accessToken;
    const refreshTokenValue = response.data.tokens?.refreshToken;
    if (accessToken) {
      await setAccessToken(accessToken);
    }
    await saveRefreshToken(refreshTokenValue);

    return response.data;
  };

  const loginSocial = async (payload: LoginSocialPayload): Promise<JbDrfWebAuthResponse> => {
    const response = await createPublicAxios().post<JbDrfWebAuthResponse>(
      withBaseUrl(endpoints.loginSocial),
      withClientPayload(payload, defaultClient)
    );

    const accessToken = response.data.tokens?.accessToken;
    const refreshTokenValue = response.data.tokens?.refreshToken;
    if (accessToken) {
      await setAccessToken(accessToken);
    }
    await saveRefreshToken(refreshTokenValue);

    return response.data;
  };

  const loginSocialPrecheck = async (payload: LoginSocialPayload): Promise<LoginSocialPrecheckResponse> => {
    const response = await createPublicAxios().post<LoginSocialPrecheckResponse>(
      withBaseUrl(endpoints.loginSocialPrecheck),
      withClientPayload(payload, defaultClient)
    );

    return response.data;
  };

  const linkSocial = async (payload: LinkSocialPayload): Promise<Record<string, unknown>> => {
    const response = await createAuthenticatedAxiosWithRefresh().post<Record<string, unknown>>(
      withBaseUrl(endpoints.loginSocialLink),
      payload
    );

    return response.data;
  };

  const unlinkSocial = async (payload: UnlinkSocialPayload): Promise<Record<string, unknown>> => {
    const response = await createAuthenticatedAxiosWithRefresh().post<Record<string, unknown>>(
      withBaseUrl(endpoints.loginSocialUnlink),
      payload
    );

    return response.data;
  };

  const requestOtp = async (payload: RequestOtpPayload): Promise<Record<string, unknown>> => {
    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.otpRequest),
      payload
    );

    return response.data;
  };

  const verifyOtp = async (payload: VerifyOtpPayload): Promise<JbDrfWebAuthResponse> => {
    const normalizedPayload: Record<string, unknown> = {
      ...withClientPayload(payload, defaultClient)
    };

    if (payload.code && !payload.otp) {
      normalizedPayload.otp = payload.code;
    }

    const response = await createPublicAxios().post<JbDrfWebAuthResponse>(
      withBaseUrl(endpoints.loginOtpVerify),
      normalizedPayload
    );

    const accessToken = response.data.tokens?.accessToken;
    const refreshTokenValue = response.data.tokens?.refreshToken;
    if (accessToken) {
      await setAccessToken(accessToken);
    }
    await saveRefreshToken(refreshTokenValue);

    return response.data;
  };

  const register = async (payload: RegisterPayload): Promise<ApiDetailResponse> => {
    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.register),
      payload
    );

    return normalizeDetailResponse(response.data);
  };

  const confirmAccountEmail = async (payload: AccountConfirmationPayload): Promise<ApiDetailResponse> => {
    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.accountConfirmation),
      payload
    );

    return normalizeDetailResponse(response.data);
  };

  const resendAccountConfirmation = async (
    payload: AccountConfirmationResendPayload
  ): Promise<ApiDetailResponse> => {
    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.accountConfirmationResend),
      payload
    );

    return normalizeDetailResponse(response.data);
  };

  const getMe = async (): Promise<JbDrfWebAuthResponse> => {
    const response = await createAuthenticatedAxiosWithRefresh().get<JbDrfWebAuthResponse>(
      withBaseUrl(endpoints.me)
    );

    return response.data;
  };

  const getProfiles = async (): Promise<ProfilesResponse> => {
    const response = await createAuthenticatedAxiosWithRefresh().get<ProfilesResponse>(
      withBaseUrl(endpoints.profiles)
    );

    return response.data;
  };

  const requestPasswordReset = async (
    payload: PasswordResetRequestPayload
  ): Promise<Record<string, unknown>> => {
    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.passwordResetRequest),
      payload
    );

    return normalizeDetailResponse(response.data);
  };

  const confirmPasswordReset = async (
    payload: PasswordResetConfirmPayload
  ): Promise<Record<string, unknown>> => {
    const normalizedPayload: Record<string, unknown> = {
      ...payload
    };

    if (payload.newPassword && !payload.password) {
      normalizedPayload.password = payload.newPassword;
    }

    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.passwordResetConfirm),
      normalizedPayload
    );

    return response.data;
  };

  const changePassword = async (payload: PasswordChangePayload): Promise<Record<string, unknown>> => {
    const response = await createAuthenticatedAxiosWithRefresh().post<Record<string, unknown>>(
      withBaseUrl(endpoints.passwordResetChange),
      payload
    );

    return response.data;
  };

  const switchProfile = async (payload: SwitchProfilePayload): Promise<JbDrfWebAuthResponse> => {
    const response = await createAuthenticatedAxiosWithRefresh().post<JbDrfWebAuthResponse>(
      withBaseUrl(endpoints.switchProfile),
      withClientPayload(payload, defaultClient)
    );

    const accessToken = response.data.tokens?.accessToken;
    const refreshTokenValue = response.data.tokens?.refreshToken;
    if (accessToken) {
      await setAccessToken(accessToken);
    }
    await saveRefreshToken(refreshTokenValue);

    return response.data;
  };

  const logout = async () => {
    await clearSession();
    await clearStoredRefreshToken();
  };

  return {
    endpoints,
    tokenStorage,
    getAccessToken,
    setAccessToken,
    clearSession,
    createPublicAxios,
    createAuthenticatedAxios,
    createAuthenticatedAxiosWithRefresh,
    loginBasic,
    loginSocial,
    loginSocialPrecheck,
    linkSocial,
    unlinkSocial,
    requestOtp,
    verifyOtp,
    register,
    confirmAccountEmail,
    resendAccountConfirmation,
    getMe,
    getProfiles,
    requestPasswordReset,
    confirmPasswordReset,
    changePassword,
    refreshToken,
    switchProfile,
    logout
  };
};

export const createAuthClientFromJBExpoConfig = (
  appConfig: JBAppConfig,
  overrides?: Omit<JbDrfAuthConfig, 'apiBaseUrl' | 'apiBasePath'>
): AuthClient => {
  return createAuthClient({
    apiBaseUrl: getApiUrl(appConfig),
    apiBasePath: getAuthBasePath(appConfig),
    ...(overrides ?? {})
  });
};
