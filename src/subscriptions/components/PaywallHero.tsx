import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Box, Heading, Text, VStack } from '../../ui';
import { getColor } from '../../utils/colors';
import { BillingPlanEntitlement } from '../types';

export type PaywallHeroProps = {
  title?: string;
  subtitle?: string;
  /** Lista de entitlements del backend; render como bullets ✓. */
  features?: BillingPlanEntitlement[];
  /** Trial info opcional para mostrar como banner highlight. */
  trial?: { eligible: boolean; days: number };
  /** Texto de copy para el banner del trial. */
  trialCopy?: string;
  /** Color principal del hero (gradient base). Default: getColor('primary')[500]. */
  accentColor?: string;
  /** Color del texto del hero. Default: typography.white. */
  textColor?: string;
};

const DEFAULT_FEATURE_LIST: { key: string; label: string }[] = [
  { key: 'finzenio.unlimited_accounts', label: 'Cuentas ilimitadas' },
  { key: 'finzenio.statement_imports', label: 'Importar estados de cuenta' },
  { key: 'finzenio.project_budgets', label: 'Proyectos sin límite' },
  { key: 'finzenio.loans', label: 'Control de préstamos' },
  { key: 'finzenio.multi_profile', label: 'Múltiples perfiles' },
  { key: 'finzenio.custom_categories', label: 'Categorías personalizadas' },
  { key: 'finzenio.advanced_reports', label: 'Reportes avanzados' },
];

/**
 * Hero del paywall: gradient con título + subtitle + lista de features.
 * Lee `getColor("primary")` para el gradient — automáticamente respeta el
 * theme de la app que consume el devkit.
 */
export const PaywallHero: React.FC<PaywallHeroProps> = ({
  title = 'FinZenio Premium',
  subtitle = 'Lleva tus finanzas al siguiente nivel.',
  features,
  trial,
  trialCopy,
  accentColor,
  textColor,
}) => {
  const primary = getColor('primary');
  const bgFrom = accentColor ?? primary?.[600] ?? '#047857';
  const bgTo = primary?.[400] ?? '#34D399';
  const fg = textColor ?? '#FFFFFF';

  const featureItems = React.useMemo(() => {
    if (!features || features.length === 0) {
      return DEFAULT_FEATURE_LIST;
    }
    // Filter out paraguas "premium" key — no aporta valor visualmente.
    return features
      .filter((f) => !/\.premium$/.test(f.key))
      .map((f) => ({ key: f.key, label: f.name }));
  }, [features]);

  const showTrial = trial?.eligible && (trial.days ?? 0) > 0;

  return (
    <Box
      style={[
        styles.container,
        {
          backgroundColor: bgFrom,
          // Para el gradient visual usamos overlay de la pseudo-card;
          // Native pure RN no soporta gradient sin libs externas. El
          // accent color sólido luce limpio y consistente.
        },
      ]}
    >
      <View style={[styles.glowAccent, { backgroundColor: bgTo, opacity: 0.35 }]} />

      <VStack space="sm" style={styles.content}>
        {showTrial ? (
          <Box style={styles.trialPill}>
            <MaterialIcons name="auto-awesome" size={14} color={fg} />
            <Text style={[styles.trialPillText, { color: fg }]}>
              {trialCopy ?? `${trial.days} días gratis`}
            </Text>
          </Box>
        ) : null}

        <Heading style={[styles.title, { color: fg }]}>{title}</Heading>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: fg }]}>{subtitle}</Text>
        ) : null}

        <View style={styles.divider} />

        <VStack space="xs">
          {featureItems.slice(0, 7).map((f) => (
            <Box key={f.key} style={styles.featureRow}>
              <MaterialIcons name="check-circle" size={18} color={fg} />
              <Text style={[styles.featureText, { color: fg }]}>{f.label}</Text>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    paddingBottom: 28,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  glowAccent: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 220,
    top: -80,
    right: -60,
  },
  content: { zIndex: 1 },
  trialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 4,
  },
  trialPillText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 36,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.92,
    lineHeight: 21,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
});
