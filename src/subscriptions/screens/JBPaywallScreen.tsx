// TODO[phase-4-stripe]: branch checkout flow by Platform.OS.
// - iOS: always IAP via RevenueCat (App Store policy).
// - Android: IAP first; optional Stripe "pay with card" fallback when web is wired.
// - Web: Stripe-only (`useWebCheckoutMutation` from `client.createCheckoutSession`).
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { JBPlanCard } from '../components/JBPlanCard';
import { useJBBilling } from '../provider';
import { useTrialInfo } from '../hooks';
import {
  getOfferings,
  isPurchasesAvailable,
  purchasePackage,
  restorePurchases
} from '../purchases';
import { BillingPlan, BillingPlanPrice } from '../types';

export type JBPaywallScreenOverrides = {
  title?: string;
  subtitle?: string;
  trialCtaLabel?: string;
  purchaseCtaLabel?: string;
  restoreLabel?: string;
};

export type JBPaywallScreenProps = {
  overrides?: JBPaywallScreenOverrides;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

const useOfferings = () => {
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getOfferings();
        if (!cancelled) setOfferings(data);
      } catch (err) {
        /* swallow — paywall still renders with backend prices */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return { offerings, loading };
};

const findPackageForPrice = (offerings: any, price: BillingPlanPrice) => {
  if (!offerings || !price.revenuecatProductId) return null;
  const current = offerings.current;
  if (!current?.availablePackages) return null;
  return (
    current.availablePackages.find(
      (pkg: any) => pkg?.product?.identifier === price.revenuecatProductId
    ) ?? null
  );
};

export const JBPaywallScreen: React.FC<JBPaywallScreenProps> = ({ overrides, onSuccess, onError }) => {
  const { hooks } = useJBBilling();
  const catalogQuery = hooks.useBillingCatalogQuery();
  const trial = useTrialInfo();
  const { offerings, loading: offeringsLoading } = useOfferings();
  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const premiumPlan = useMemo<BillingPlan | undefined>(
    () => catalogQuery.data?.plans?.find((p) => (p.tier ?? '').toLowerCase() === 'premium'),
    [catalogQuery.data]
  );

  const premiumPrices = premiumPlan?.prices ?? [];

  React.useEffect(() => {
    if (selectedPriceId == null && premiumPrices.length > 0) {
      setSelectedPriceId(premiumPrices[0].id);
    }
  }, [premiumPrices, selectedPriceId]);

  const handlePurchase = async () => {
    setErrorMsg(null);
    const price = premiumPrices.find((p) => p.id === selectedPriceId);
    if (!price) return;
    const pkg = findPackageForPrice(offerings, price);
    if (!pkg) {
      const msg = 'Producto no disponible en la tienda.';
      setErrorMsg(msg);
      onError?.(msg);
      return;
    }
    try {
      setPurchasing(true);
      await purchasePackage(pkg);
      onSuccess?.();
    } catch (err: any) {
      if (err?.userCancelled) return;
      const msg = err?.message ?? 'Error al procesar la compra.';
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setErrorMsg(null);
    try {
      await restorePurchases();
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.message ?? 'No fue posible restaurar.';
      setErrorMsg(msg);
      onError?.(msg);
    }
  };

  const showTrialCta = trial.eligible && trial.days > 0;
  const ctaLabel = showTrialCta
    ? overrides?.trialCtaLabel ?? `Comenzar prueba gratis (${trial.days} días)`
    : overrides?.purchaseCtaLabel ?? 'Suscribirse';
  const restoreLabel = overrides?.restoreLabel ?? 'Restaurar compras';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{overrides?.title ?? 'Acceso Premium'}</Text>
      {overrides?.subtitle ? <Text style={styles.subtitle}>{overrides.subtitle}</Text> : null}

      {!isPurchasesAvailable() ? (
        <View style={styles.disabledBanner}>
          <Text style={styles.disabledBannerText}>
            Las compras dentro de la app no están disponibles en este dispositivo.
          </Text>
        </View>
      ) : null}

      {(catalogQuery.isLoading || offeringsLoading) && (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      )}

      {premiumPrices.map((price) => {
        const pkg = findPackageForPrice(offerings, price);
        const displayPrice = pkg?.product?.priceString ?? `${price.amount} ${price.currency}`;
        return (
          <JBPlanCard
            key={price.id}
            plan={premiumPlan as BillingPlan}
            price={price}
            displayPrice={displayPrice}
            selected={selectedPriceId === price.id}
            trialEligible={showTrialCta}
            trialDays={trial.days}
            onSelect={() => setSelectedPriceId(price.id)}
          />
        );
      })}

      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

      <View
        style={[
          styles.primaryCta,
          (purchasing || !selectedPriceId) && styles.primaryCtaDisabled
        ]}
        onTouchEnd={() => {
          if (!purchasing && selectedPriceId) handlePurchase();
        }}
      >
        <Text style={styles.primaryCtaText}>
          {purchasing ? 'Procesando…' : ctaLabel}
        </Text>
      </View>

      <View style={styles.secondaryCta} onTouchEnd={handleRestore}>
        <Text style={styles.secondaryCtaText}>{restoreLabel}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#1F1F2E', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#5C5C70', marginBottom: 16 },
  center: { paddingVertical: 24, alignItems: 'center' },
  disabledBanner: {
    padding: 12,
    backgroundColor: '#FFF4D6',
    borderRadius: 8,
    marginBottom: 12
  },
  disabledBannerText: { color: '#7A5A00', fontSize: 13 },
  error: { color: '#C0392B', marginTop: 12, fontSize: 13 },
  primaryCta: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#5A4FA8',
    alignItems: 'center'
  },
  primaryCtaDisabled: { opacity: 0.6 },
  primaryCtaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondaryCta: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  secondaryCtaText: { color: '#5A4FA8', fontWeight: '600', fontSize: 14 }
});
