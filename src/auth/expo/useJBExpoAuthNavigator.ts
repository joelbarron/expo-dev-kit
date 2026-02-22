import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';

import { JBAuthNavigator } from '../screens/types';

export type JBExpoAuthNavigatorPaths = {
  signIn?: string;
  signUp?: string;
  forgotPassword?: string;
  resetPassword?: string;
  verifyEmail?: string;
  welcome?: string;
  signedIn?: string;
};

const defaultPaths: Required<JBExpoAuthNavigatorPaths> = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  welcome: '/welcome',
  signedIn: '/'
};

export const useJBExpoAuthNavigator = (paths?: JBExpoAuthNavigatorPaths): JBAuthNavigator => {
  const router = useRouter();
  const nav = router as any;
  const resolved = useMemo(
    () => ({
      ...defaultPaths,
      ...(paths ?? {}),
    }),
    [paths],
  );

  const goToSignIn = useCallback(
    (params?: { initialMode?: "password" | "otp" }) =>
      nav.push({ pathname: resolved.signIn, params }),
    [nav, resolved.signIn],
  );
  const goToSignInReplace = useCallback(() => nav.replace(resolved.signIn), [nav, resolved.signIn]);
  const goToSignUp = useCallback(() => nav.push(resolved.signUp), [nav, resolved.signUp]);
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
  const onSignedIn = useCallback(() => nav.replace(resolved.signedIn), [nav, resolved.signedIn]);
  const onSignedOut = useCallback(() => nav.replace(resolved.signIn), [nav, resolved.signIn]);

  return useMemo(
    () => ({
      goToSignIn,
      goToSignInReplace,
      goToSignUp,
      goToForgotPassword,
      goToResetPassword,
      goToVerifyEmail,
      goToVerifyEmailReplace,
      goToWelcome,
      onSignedIn,
      onSignedOut,
    }),
    [
      goToSignIn,
      goToSignInReplace,
      goToSignUp,
      goToForgotPassword,
      goToResetPassword,
      goToVerifyEmail,
      goToVerifyEmailReplace,
      goToWelcome,
      onSignedIn,
      onSignedOut,
    ],
  );
};
