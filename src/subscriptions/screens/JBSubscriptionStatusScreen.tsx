import React, { useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useJBBilling } from '../provider';
import { restorePurchases } from '../purchases';

export type JBSubscriptionStatusScreenProps = {
  overrides?: {
    title?: string;
    restoreLabel?: string;
    managementLabel?: string;
  };
  onRestoreSuccess?: () => void;
  onError?: (message: string) => void;
};

const MANAGEMENT_URLS = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions'
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
};

export const JBSubscriptionStatusScreen: React.FC<JBSubscriptionStatusScreenProps> = ({
  overrides,
  onRestoreSuccess,
  onError
}) => {
  const { hooks } = useJBBilling();
  const statusQuery = hooks.useBillingStatusQuery();
  const [restoring, setRestoring] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sub = statusQuery.data?.subscription;

  const handleRestore = async () => {
    setErrorMsg(null);
    try {
      setRestoring(true);
      await restorePurchases();
      await statusQuery.refetch();
      onRestoreSuccess?.();
    } catch (err: any) {
      const msg = err?.message ?? 'No fue posible restaurar.';
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      setRestoring(false);
    }
  };

  const handleManage = () => {
    const url = Platform.OS === 'ios' ? MANAGEMENT_URLS.ios : MANAGEMENT_URLS.android;
    Linking.openURL(url);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{overrides?.title ?? 'Mi suscripción'}</Text>

      {statusQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : sub ? (
        <View style={styles.card}>
          <Text style={styles.row}>
            <Text style={styles.label}>Plan: </Text>
            {sub.planSlug}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Estado: </Text>
            {sub.status}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Proveedor: </Text>
            {sub.provider}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Renovación: </Text>
            {formatDate(sub.currentPeriodEnd)}
          </Text>
          {sub.cancelAtPeriodEnd ? (
            <Text style={[styles.row, styles.warn]}>Cancela al final del período</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.row}>No tienes una suscripción activa.</Text>
        </View>
      )}

      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

      <View style={styles.cta} onTouchEnd={handleManage}>
        <Text style={styles.ctaText}>
          {overrides?.managementLabel ?? 'Administrar suscripción'}
        </Text>
      </View>

      <View
        style={[styles.secondaryCta, restoring && styles.secondaryCtaDisabled]}
        onTouchEnd={() => {
          if (!restoring) handleRestore();
        }}
      >
        <Text style={styles.secondaryCtaText}>
          {restoring ? 'Restaurando…' : overrides?.restoreLabel ?? 'Restaurar compras'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#1F1F2E', marginBottom: 16 },
  center: { paddingVertical: 24, alignItems: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0EA',
    padding: 16
  },
  row: { fontSize: 14, color: '#1F1F2E', marginVertical: 3 },
  label: { fontWeight: '600' },
  warn: { color: '#B57100', marginTop: 6 },
  error: { color: '#C0392B', marginTop: 12, fontSize: 13 },
  cta: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#5A4FA8',
    alignItems: 'center'
  },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondaryCta: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  secondaryCtaDisabled: { opacity: 0.6 },
  secondaryCtaText: { color: '#5A4FA8', fontWeight: '600', fontSize: 14 }
});
