import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';

import { JBAuthNavigator } from '../screens/types';
import { getAuthRoutesConfig, getLastCreatedJBExpoConfig } from '../../config';
import { useAppConfigStore } from '../../runtime';
import { guestBrowse } from '../../navigation';

export type JBExpoAuthNavigatorPaths = {
  signIn?: string;
  signInPassword?: string;
  signInOtp?: string;
  signUp?: string;
  signUpForm?: string;
  forgotPassword?: string;
  resetPassword?: string;
  verifyEmail?: string;
  welcome?: string;
  guestExplore?: string;
  signedIn?: string;
};

const defaultPaths: Required<JBExpoAuthNavigatorPaths> = {
  signIn: '/auth-entry',
  signInPassword: '/sign-in-password',
  signInOtp: '/sign-in-otp',
  signUp: '/sign-up-form',
  signUpForm: '/sign-up-form',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  welcome: '/welcome',
  guestExplore: '/',
  signedIn: '/'
};

export const useJBExpoAuthNavigator = (paths?: JBExpoAuthNavigatorPaths): JBAuthNavigator => {
  const router = useRouter();
  const nav = router as any;
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        auth: {
          ...baseConfig.auth,
          ...(appConfig?.auth ?? {}),
        },
      } as any),
    [appConfig?.auth, baseConfig],
  );
  const authRoutes = useMemo(
    () => getAuthRoutesConfig(mergedConfig),
    [mergedConfig],
  );
  const configPaths = useMemo(
    () => ({
      signIn: authRoutes.authEntry,
      signInPassword: authRoutes.signInPassword,
      signInOtp: authRoutes.signInOtp,
      signUp: authRoutes.signUpForm,
      signUpForm: authRoutes.signUpForm,
      forgotPassword: authRoutes.forgotPassword,
      resetPassword: authRoutes.resetPassword,
      verifyEmail: authRoutes.verifyEmail,
      welcome: authRoutes.welcome,
      guestExplore: authRoutes.guestExplore,
      signedIn: authRoutes.signedIn,
    }),
    [authRoutes],
  );
  const resolved = useMemo(
    () => ({
      ...defaultPaths,
      ...configPaths,
      ...(paths ?? {}),
    }),
    [configPaths, paths],
  );

  const goToSignIn = useCallback(
    (params?: { initialMode?: "password" | "otp" }) => {
      const initialMode = params?.initialMode;
      if (initialMode === "otp") {
        return nav.push(resolved.signInOtp);
      }
      if (initialMode === "password") {
        return nav.push(resolved.signInPassword);
      }
      return nav.push({ pathname: resolved.signIn, params });
    },
    [nav, resolved.signIn, resolved.signInOtp, resolved.signInPassword],
  );
  const goToSignInReplace = useCallback(() => nav.replace(resolved.signIn), [nav, resolved.signIn]);
  const goToSignInPassword = useCallback(() => nav.push(resolved.signInPassword), [nav, resolved.signInPassword]);
  const goToSignInPasswordReplace = useCallback(() => nav.replace(resolved.signInPassword), [nav, resolved.signInPassword]);
  const goToSignInOtp = useCallback(() => nav.push(resolved.signInOtp), [nav, resolved.signInOtp]);
  const goToSignInOtpReplace = useCallback(() => nav.replace(resolved.signInOtp), [nav, resolved.signInOtp]);
  const goToSignUp = useCallback(() => nav.push(resolved.signUp), [nav, resolved.signUp]);
  const goToSignUpForm = useCallback(() => nav.push(resolved.signUpForm), [nav, resolved.signUpForm]);
  const goToSignUpFormReplace = useCallback(() => nav.replace(resolved.signUpForm), [nav, resolved.signUpForm]);
  const goToForgotPassword = useCallback(
    () => nav.push(resolved.forgotPassword),
    [nav, resolved.forgotPassword],
  );
  const goToResetPassword = useCallback(
    (params?: { uid?: string; token?: string }) =>
      nav.push({ pathname: resolved.resetPassword, params }),
    [nav, resolved.resetPassword],
  );
  const goToVerifyEmail = useCallback(
    (params?: { email?: string; uid?: string; token?: string }) =>
      nav.push({ pathname: resolved.verifyEmail, params }),
    [nav, resolved.verifyEmail],
  );
  const goToVerifyEmailReplace = useCallback(
    (params?: { email?: string; uid?: string; token?: string }) =>
      nav.replace({ pathname: resolved.verifyEmail, params }),
    [nav, resolved.verifyEmail],
  );
  const goToWelcome = useCallback(() => nav.replace(resolved.welcome), [nav, resolved.welcome]);
  const goToGuestExplore = useCallback(
    () => {
      guestBrowse.activate();
      nav.replace(resolved.guestExplore);
    },
    [nav, resolved.guestExplore]
  );
  const onSignedIn = useCallback(() => nav.replace(resolved.signedIn), [nav, resolved.signedIn]);
  const onSignedOut = useCallback(() => nav.replace(resolved.signIn), [nav, resolved.signIn]);

  return useMemo(
    () => ({
      goToSignIn,
      goToSignInReplace,
      goToSignInPassword,
      goToSignInPasswordReplace,
      goToSignInOtp,
      goToSignInOtpReplace,
      goToSignUp,
      goToSignUpForm,
      goToSignUpFormReplace,
      goToForgotPassword,
      goToResetPassword,
      goToVerifyEmail,
      goToVerifyEmailReplace,
      goToWelcome,
      goToGuestExplore,
      onSignedIn,
      onSignedOut,
    }),
    [
      goToSignIn,
      goToSignInReplace,
      goToSignInPassword,
      goToSignInPasswordReplace,
      goToSignInOtp,
      goToSignInOtpReplace,
      goToSignUp,
      goToSignUpForm,
      goToSignUpFormReplace,
      goToForgotPassword,
      goToResetPassword,
      goToVerifyEmail,
      goToVerifyEmailReplace,
      goToWelcome,
      goToGuestExplore,
      onSignedIn,
      onSignedOut,
    ],
  );
};
