import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Box, HStack, Text, VStack } from '../../ui';
import { getColor } from '../../utils/colors';
import { BillingPlan, BillingPlanPrice } from '../types';

export type PaywallPlanCardProps = {
  plan: BillingPlan;
  price: BillingPlanPrice;
  /** Precio formateado a mostrar (de la SDK store o fallback del backend). */
  displayPrice: string;
  selected: boolean;
  /** Si user es elegible para trial. */
  trialEligible?: boolean;
  trialDays?: number;
  /** Texto opcional: "Ahorra 50%", "RECOMENDADO". */
  badgeLabel?: string;
  /** Texto debajo del precio: "Renovación anual", etc. */
  intervalLabel?: string;
  onSelect: () => void;
};

const formatInterval = (interval: BillingPlanPrice['interval']): string => {
  switch (interval) {
    case 'monthly':
      return 'mes';
    case 'yearly':
      return 'año';
    case 'one_time':
      return 'una vez';
    default:
      return interval;
  }
};

/**
 * Plan card pulido para el paywall: radio visual, precio grande, badge
 * "Recomendado" o "Ahorra X%", trial info, todo respetando los tokens
 * de UI (`getColor`) del app que consume el devkit.
 */
export const PaywallPlanCard: React.FC<PaywallPlanCardProps> = ({
  plan,
  price,
  displayPrice,
  selected,
  trialEligible,
  trialDays,
  badgeLabel,
  intervalLabel,
  onSelect,
}) => {
  const primary = getColor('primary');
  const accent = primary?.[500] ?? '#10B981';
  const accentDeep = primary?.[700] ?? '#047857';
  const accentBg = primary?.[50] ?? '#ECFDF5';
  const borderInactive = primary?.[100] ?? '#E5E7EB';
  const titleColor = '#1F1F2E';
  const subtitleColor = '#6B7280';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSelect}
      style={[
        styles.card,
        {
          borderColor: selected ? accent : borderInactive,
          backgroundColor: selected ? accentBg : '#FFFFFF',
        },
      ]}
    >
      {badgeLabel ? (
        <View style={[styles.badge, { backgroundColor: accentDeep }]}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}

      <HStack space="md" style={styles.row}>
        <View
          style={[
            styles.radio,
            { borderColor: selected ? accent : borderInactive },
          ]}
        >
          {selected ? (
            <View style={[styles.radioDot, { backgroundColor: accent }]} />
          ) : null}
        </View>

        <VStack space="xs" style={styles.body}>
          <Text style={[styles.planTitle, { color: titleColor }]}>
            {intervalLabel ?? (price.interval === 'yearly' ? 'Anual' : 'Mensual')}
          </Text>

          <HStack space="xs" style={styles.priceRow}>
            <Text style={[styles.price, { color: accentDeep }]}>{displayPrice}</Text>
            <Text style={[styles.interval, { color: subtitleColor }]}>
              {`/${formatInterval(price.interval)}`}
            </Text>
          </HStack>

          {trialEligible && trialDays ? (
            <HStack space="xs" style={styles.trialRow}>
              <MaterialIcons name="schedule" size={14} color={accentDeep} />
              <Text style={[styles.trialText, { color: accentDeep }]}>
                {`${trialDays} días gratis · Cancela cuando quieras`}
              </Text>
            </HStack>
          ) : (
            <Text style={[styles.fineprint, { color: subtitleColor }]}>
              Renovación automática · Cancela cuando quieras
            </Text>
          )}
        </VStack>
      </HStack>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  row: { alignItems: 'center' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  body: { flex: 1, marginLeft: 12 },
  planTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  priceRow: { alignItems: 'baseline' },
  price: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
    includeFontPadding: false,
  },
  interval: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
    lineHeight: 20,
    includeFontPadding: false,
  },
  trialRow: { alignItems: 'center', marginTop: 2 },
  trialText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  fineprint: { fontSize: 12, marginTop: 2 },
});
