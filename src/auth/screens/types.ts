export type JBAuthNavigator = {
  goToSignIn: () => void;
  goToSignUp: () => void;
  goToForgotPassword: () => void;
  goToResetPassword?: (params?: { uid?: string; token?: string }) => void;
  goToVerifyEmail?: (params?: { email?: string; uid?: string; token?: string }) => void;
  goToWelcome?: () => void;
  onSignedIn?: () => void;
  onSignedOut?: () => void;
};
