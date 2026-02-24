export type JBAuthRouteKey =
  | 'welcome'
  | 'signIn'
  | 'signUp'
  | 'forgotPassword'
  | 'resetPassword'
  | 'signOut'
  | 'accountConfirmation';

export type JBAuthRoutePaths = Record<JBAuthRouteKey, string>;

const defaultPaths: JBAuthRoutePaths = {
  welcome: '/welcome',
  signIn: '/auth-entry',
  signUp: '/sign-up-form',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  signOut: '/sign-out',
  accountConfirmation: '/verify-email'
};

export const createJBAuthRoutePaths = (overrides?: Partial<JBAuthRoutePaths>): JBAuthRoutePaths => ({
  ...defaultPaths,
  ...(overrides ?? {})
});
