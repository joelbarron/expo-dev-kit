export type JBAuthNavigator = {
  goToSignIn: (params?: { initialMode?: "password" | "otp" }) => void;
  goToSignInReplace?: () => void;
  goToSignInPassword?: () => void;
  goToSignInPasswordReplace?: () => void;
  goToSignInOtp?: () => void;
  goToSignInOtpReplace?: () => void;
  goToSignUp: () => void;
  goToSignUpForm?: () => void;
  goToSignUpFormReplace?: () => void;
  goToForgotPassword: () => void;
  goToResetPassword?: (params?: { uid?: string; token?: string }) => void;
  goToVerifyEmail?: (params?: { email?: string; uid?: string; token?: string }) => void;
  goToVerifyEmailReplace?: (params?: { email?: string; uid?: string; token?: string }) => void;
  goToWelcome?: () => void;
  onSignedIn?: () => void;
  onSignedOut?: () => void;
};
