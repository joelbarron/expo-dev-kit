import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTrialInfo, usePaywall } from '../hooks';

export type JBTrialBannerCardProps = {
  /** Override copy. */
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  /** Reason passed to `triggerPaywall`. */
  reason?: string;
  hideWhenIneligible?: boolean;
};

/**
 * Minimal trial banner. Apps usually replace this with their branded
 * variant; the lib exports it as a starter.
 */
export const JBTrialBannerCard: React.FC<JBTrialBannerCardProps> = ({
  title,
  subtitle,
  ctaLabel,
  reason = 'trial_banner',
  hideWhenIneligible = true
}) => {
  const trial = useTrialInfo();
  const { trigger } = usePaywall();
  if (hideWhenIneligible && (!trial.eligible || trial.days <= 0)) return null;
  return (
    <Pressable onPress={() => trigger(reason)} style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>{title ?? `Prueba gratis ${trial.days} días`}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.cta}>{ctaLabel ?? 'Activar'}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F4F0FF',
    marginVertical: 8
  },
  body: { flex: 1, paddingRight: 12 },
  title: { fontSize: 15, fontWeight: '600', color: '#3A2A8A' },
  subtitle: { fontSize: 13, color: '#5A4FA8', marginTop: 2 },
  cta: { fontSize: 14, fontWeight: '600', color: '#5A4FA8' }
});
