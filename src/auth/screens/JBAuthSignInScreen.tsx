import { JBAuthSignInEntryScreen } from './JBAuthSignInEntryScreen';
import { JBAuthSignInOtpScreen } from './JBAuthSignInOtpScreen';
import { JBAuthSignInPasswordScreen } from './JBAuthSignInPasswordScreen';
import { JBAuthNavigator } from './types';
import { LoginSocialPayload } from '../types';

export type JBAuthSignInScreenProps = {
  navigator: JBAuthNavigator;
  enableOtp?: boolean;
  initialMode?: 'password' | 'otp';
  screenVariant?: 'combined' | 'hub' | 'passwordForm' | 'otpForm';
  socialProviders?: string[];
  socialAuthenticator?: (provider: string) => Promise<LoginSocialPayload | null>;
};

export function JBAuthSignInScreen(props: JBAuthSignInScreenProps) {
  const { screenVariant = 'combined', initialMode = 'password' } = props;

  if (screenVariant === 'hub') {
    return <JBAuthSignInEntryScreen {...props} />;
  }
  if (screenVariant === 'passwordForm') {
    return <JBAuthSignInPasswordScreen navigator={props.navigator} />;
  }
  if (screenVariant === 'otpForm') {
    return <JBAuthSignInOtpScreen navigator={props.navigator} />;
  }

  // Backward compatibility: preserve the old behavior by routing to the relevant separated screen.
  if (initialMode === 'otp') {
    return <JBAuthSignInOtpScreen navigator={props.navigator} />;
  }
  return <JBAuthSignInPasswordScreen navigator={props.navigator} />;
}
