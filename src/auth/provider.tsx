import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AuthClient } from './client';
import { useAppConfigStore } from '../runtime';
import { getLastCreatedJBExpoConfig } from '../config';
import { loginDeviceInfo } from '../utils/device-info';
import {
  AccountConfirmationPayload,
  AccountConfirmationResendPayload,
  ApiDetailResponse,
  LinkSocialPayload,
  LoginBasicPayload,
  LoginSocialPayload,
  LoginSocialPrecheckResponse,
  PasswordChangePayload,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  ProfilesResponse,
  RegisterPayload,
  RequestOtpPayload,
  SwitchProfilePayload,
  UnlinkSocialPayload,
  VerifyOtpPayload
} from './types';

export type JBAuthStatus = 'configuring' | 'authenticated' | 'unauthenticated';

const logAuthDebug = (enabled: boolean, event: string, payload?: unknown) => {
  if (!enabled) {
    return;
  }
  if (payload === undefined) {
    console.log(`[JBAuth] ${event}`);
    return;
  }
  console.log(`[JBAuth] ${event}`, payload);
};

export type JBAuthContextValue = {
  authStatus: JBAuthStatus;
  isAuthenticated: boolean;
  user: unknown | null;
  signIn: (payload: LoginBasicPayload) => Promise<unknown>;
  signInSocial: (payload: LoginSocialPayload) => Promise<unknown>;
  signInSocialPrecheck: (payload: LoginSocialPayload) => Promise<LoginSocialPrecheckResponse>;
  linkSocial: (payload: LinkSocialPayload) => Promise<Record<string, unknown>>;
  unlinkSocial: (payload: UnlinkSocialPayload) => Promise<Record<string, unknown>>;
  signUp: (payload: RegisterPayload) => Promise<ApiDetailResponse>;
  confirmAccountEmail: (payload: AccountConfirmationPayload) => Promise<ApiDetailResponse>;
  resendAccountConfirmation: (payload: AccountConfirmationResendPayload) => Promise<ApiDetailResponse>;
  signInOtp: (payload: VerifyOtpPayload) => Promise<unknown>;
  requestOtp: (payload: RequestOtpPayload) => Promise<Record<string, unknown>>;
  requestPasswordReset: (payload: PasswordResetRequestPayload) => Promise<Record<string, unknown>>;
  confirmPasswordReset: (payload: PasswordResetConfirmPayload) => Promise<Record<string, unknown>>;
  changePassword: (payload: PasswordChangePayload) => Promise<Record<string, unknown>>;
  getProfiles: () => Promise<ProfilesResponse>;
  switchProfile: (payload: SwitchProfilePayload) => Promise<unknown>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
};

type JBAuthProviderProps = {
  authClient: AuthClient;
  children: ReactNode;
  onAuthStateChanged?: (state: {
    authStatus: JBAuthStatus;
    isAuthenticated: boolean;
    user: unknown | null;
  }) => void;
};

const JBAuthContext = createContext<JBAuthContextValue | undefined>(undefined);

const withMobileDevicePayload = async <TPayload extends { client?: 'web' | 'mobile'; device?: unknown }>(
  payload: TPayload
): Promise<TPayload> => {
  const client = payload.client ?? 'mobile';
  if (client !== 'mobile' || payload.device) {
    return payload;
  }

  const device = await loginDeviceInfo();
  return {
    ...payload,
    client,
    device
  };
};

export function JBAuthProvider(props: JBAuthProviderProps) {
  const { authClient, children, onAuthStateChanged } = props;
  const baseConfig = getLastCreatedJBExpoConfig();
  const isConfigDebug = useAppConfigStore(
    (state: any) => Boolean(state?.appConfig?.debug ?? baseConfig.debug)
  );

  const [authStatus, setAuthStatus] = useState<JBAuthStatus>('configuring');
  const [user, setUser] = useState<unknown | null>(null);

  useEffect(() => {
    onAuthStateChanged?.({
      authStatus,
      isAuthenticated: authStatus === 'authenticated',
      user
    });
  }, [authStatus, onAuthStateChanged, user]);

  const setAuthenticatedSession = useCallback((authResponse: { user?: unknown }) => {
    setUser(authResponse.user ?? null);
    setAuthStatus('authenticated');
    return authResponse.user ?? null;
  }, []);

  const signIn = useCallback(
    async (payload: LoginBasicPayload) => {
      const normalizedPayload = await withMobileDevicePayload(payload);
      logAuthDebug(isConfigDebug, 'signIn.request', { login: normalizedPayload.login || 'provided', client: normalizedPayload.client });
      const response = await authClient.loginBasic(normalizedPayload);
      logAuthDebug(isConfigDebug, 'signIn.response', response);
      return setAuthenticatedSession(response);
    },
    [authClient, isConfigDebug, setAuthenticatedSession]
  );

  const signInOtp = useCallback(
    async (payload: VerifyOtpPayload) => {
      const normalizedPayload = await withMobileDevicePayload(payload);
      logAuthDebug(isConfigDebug, 'signInOtp.request', {
        phone: normalizedPayload.phone,
        channel: normalizedPayload.channel,
        role: normalizedPayload.role,
        client: normalizedPayload.client
      });
      const response = await authClient.verifyOtp(normalizedPayload);
      logAuthDebug(isConfigDebug, 'signInOtp.response', response);
      return setAuthenticatedSession(response);
    },
    [authClient, isConfigDebug, setAuthenticatedSession]
  );

  const signInSocial = useCallback(
    async (payload: LoginSocialPayload) => {
      const normalizedPayload = await withMobileDevicePayload(payload);
      logAuthDebug(isConfigDebug, 'signInSocial.request', {
        provider: normalizedPayload.provider,
        client: normalizedPayload.client
      });
      const response = await authClient.loginSocial(normalizedPayload);
      logAuthDebug(isConfigDebug, 'signInSocial.response', response);
      return setAuthenticatedSession(response);
    },
    [authClient, isConfigDebug, setAuthenticatedSession]
  );

  const signInSocialPrecheck = useCallback(
    async (payload: LoginSocialPayload) => {
      const normalizedPayload = await withMobileDevicePayload(payload);
      return authClient.loginSocialPrecheck(normalizedPayload);
    },
    [authClient]
  );

  const linkSocial = useCallback(
    async (payload: LinkSocialPayload) => authClient.linkSocial(payload),
    [authClient]
  );

  const unlinkSocial = useCallback(
    async (payload: UnlinkSocialPayload) => authClient.unlinkSocial(payload),
    [authClient]
  );

  const signUp = useCallback(
    async (payload: RegisterPayload) => {
      logAuthDebug(isConfigDebug, 'signUp.request', { email: payload.email, role: payload.role });
      const response = await authClient.register(payload);
      logAuthDebug(isConfigDebug, 'signUp.response', response);
      return response;
    },
    [authClient, isConfigDebug]
  );

  const confirmAccountEmail = useCallback(
    (payload: AccountConfirmationPayload) => authClient.confirmAccountEmail(payload),
    [authClient]
  );

  const resendAccountConfirmation = useCallback(
    (payload: AccountConfirmationResendPayload) => authClient.resendAccountConfirmation(payload),
    [authClient]
  );

  const signOut = useCallback(async () => {
    await authClient.logout();
    setUser(null);
    setAuthStatus('unauthenticated');
  }, [authClient]);

  const refreshToken = useCallback(async () => {
    const response = await authClient.refreshToken();
    return response.accessToken || null;
  }, [authClient]);

  const requestOtp = useCallback(
    async (payload: RequestOtpPayload) => {
      logAuthDebug(isConfigDebug, 'requestOtp.request', payload);
      const response = await authClient.requestOtp(payload);
      logAuthDebug(isConfigDebug, 'requestOtp.response', response);
      return response;
    },
    [authClient, isConfigDebug]
  );

  const requestPasswordReset = useCallback(
    (payload: PasswordResetRequestPayload) => authClient.requestPasswordReset(payload),
    [authClient]
  );

  const confirmPasswordReset = useCallback(
    (payload: PasswordResetConfirmPayload) => authClient.confirmPasswordReset(payload),
    [authClient]
  );

  const changePassword = useCallback(
    (payload: PasswordChangePayload) => authClient.changePassword(payload),
    [authClient]
  );

  const getProfiles = useCallback(() => authClient.getProfiles(), [authClient]);

  const switchProfile = useCallback(
    async (payload: SwitchProfilePayload) => {
      const normalizedPayload = await withMobileDevicePayload(payload);
      const response = await authClient.switchProfile(normalizedPayload);
      return setAuthenticatedSession(response);
    },
    [authClient, setAuthenticatedSession]
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const accessToken = await authClient.getAccessToken();
      if (!accessToken) {
        if (isMounted) {
          setAuthStatus('unauthenticated');
        }
        return;
      }

      try {
        const response = await authClient.getMe();
        if (!isMounted) {
          return;
        }
        setAuthenticatedSession(response);
      } catch {
        if (!isMounted) {
          return;
        }
        await authClient.logout();
        setUser(null);
        setAuthStatus('unauthenticated');
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [authClient, setAuthenticatedSession]);

  const contextValue = useMemo<JBAuthContextValue>(
    () => ({
      authStatus,
      isAuthenticated: authStatus === 'authenticated',
      user,
      signIn,
      signInSocial,
      signInSocialPrecheck,
      linkSocial,
      unlinkSocial,
      signUp,
      confirmAccountEmail,
      resendAccountConfirmation,
      signInOtp,
      requestOtp,
      requestPasswordReset,
      confirmPasswordReset,
      changePassword,
      getProfiles,
      switchProfile,
      signOut,
      refreshToken
    }),
    [
      authStatus,
      user,
      signIn,
      signInSocial,
      signInSocialPrecheck,
      linkSocial,
      unlinkSocial,
      signUp,
      confirmAccountEmail,
      resendAccountConfirmation,
      signInOtp,
      requestOtp,
      requestPasswordReset,
      confirmPasswordReset,
      changePassword,
      getProfiles,
      switchProfile,
      signOut,
      refreshToken
    ]
  );

  return <JBAuthContext.Provider value={contextValue}>{children}</JBAuthContext.Provider>;
}

export const useJBAuth = (): JBAuthContextValue => {
  const context = useContext(JBAuthContext);
  if (!context) {
    throw new Error('useJBAuth must be used within a JBAuthProvider');
  }

  return context;
};
