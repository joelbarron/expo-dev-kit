import LottieView from 'lottie-react-native';
import { StyleSheet, View } from 'react-native';

import { getLastCreatedJBExpoConfig, JBLottieSource } from '../../config';
import verifyEmailAnimation from '../assets/animations/verify-email.json';

export type JBAuthVerifyEmailVisualProps = {
  source?: JBLottieSource;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  size?: number;
};

export function JBAuthVerifyEmailVisual(props: JBAuthVerifyEmailVisualProps) {
  const baseVisualConfig = getLastCreatedJBExpoConfig().auth.visuals.verifyEmail;
  const {
    source = baseVisualConfig.animationSource,
    autoPlay = baseVisualConfig.animationAutoPlay ?? true,
    loop = baseVisualConfig.animationLoop ?? true,
    speed = baseVisualConfig.animationSpeed ?? 1,
    size = baseVisualConfig.animationSize ?? 180
  } = props;

  const resolvedSource = (source ?? verifyEmailAnimation) as any;

  return (
    <View style={styles.container}>
      <LottieView
        source={resolvedSource}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8
  }
});
