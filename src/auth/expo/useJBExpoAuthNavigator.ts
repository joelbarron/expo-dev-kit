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
  const resolved = {
    ...defaultPaths,
    ...(paths ?? {})
  };

  return {
    goToSignIn: () => nav.push(resolved.signIn),
    goToSignUp: () => nav.push(resolved.signUp),
    goToForgotPassword: () => nav.push(resolved.forgotPassword),
    goToResetPassword: (params?: { uid?: string; token?: string }) =>
      nav.push({ pathname: resolved.resetPassword, params }),
    goToVerifyEmail: (params?: { email?: string; uid?: string; token?: string }) =>
      nav.push({ pathname: resolved.verifyEmail, params }),
    goToWelcome: () => nav.replace(resolved.welcome),
    onSignedIn: () => nav.replace(resolved.signedIn),
    onSignedOut: () => nav.replace(resolved.signIn)
  };
};
