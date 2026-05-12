import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BillingPlan, BillingPlanPrice } from '../types';

export type JBPlanCardProps = {
  plan: BillingPlan;
  price: BillingPlanPrice;
  /** Display price from RC offering (preferred over backend amount). */
  displayPrice?: string;
  selected?: boolean;
  trialEligible?: boolean;
  trialDays?: number;
  ctaLabel?: string;
  onSelect?: (plan: BillingPlan, price: BillingPlanPrice) => void;
};

export const JBPlanCard: React.FC<JBPlanCardProps> = ({
  plan,
  price,
  displayPrice,
  selected,
  trialEligible,
  trialDays,
  ctaLabel,
  onSelect
}) => {
  return (
    <Pressable
      onPress={() => onSelect?.(plan, price)}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <Text style={styles.name}>{plan.name}</Text>
      <Text style={styles.price}>
        {displayPrice ?? `${price.amount} ${price.currency}`} / {price.interval === 'yearly' ? 'año' : 'mes'}
      </Text>
      {trialEligible && trialDays && trialDays > 0 ? (
        <Text style={styles.trial}>{trialDays} días gratis</Text>
      ) : null}
      {plan.description ? <Text style={styles.description}>{plan.description}</Text> : null}
      {ctaLabel ? (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D8E0',
    backgroundColor: '#FFFFFF',
    marginVertical: 6
  },
  cardSelected: { borderColor: '#5A4FA8', borderWidth: 2 },
  name: { fontSize: 17, fontWeight: '700', color: '#1F1F2E' },
  price: { fontSize: 15, fontWeight: '600', color: '#5A4FA8', marginTop: 4 },
  trial: { fontSize: 13, color: '#0A8A4A', marginTop: 2, fontWeight: '600' },
  description: { fontSize: 13, color: '#5C5C70', marginTop: 8 },
  cta: { marginTop: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: '#5A4FA8', alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontWeight: '700' }
});
