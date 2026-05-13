// TODO[phase-4-stripe]: branch checkout flow by Platform.OS.
// - iOS: always IAP via RevenueCat (App Store policy).
// - Android: IAP first; optional Stripe "pay with card" fallback when web is wired.
// - Web: Stripe-only (`useWebCheckoutMutation` from `client.createCheckoutSession`).
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Box, Heading, VStack } from '../../ui';
import { getColor } from '../../utils/colors';
import { PaywallHero } from '../components/PaywallHero';
import { PaywallPlanCard } from '../components/PaywallPlanCard';
import { PremiumUnavailableCard } from '../components/PremiumUnavailableCard';
import { useTrialInfo } from '../hooks';
import {
  getOfferings,
  isPurchasesAvailable,
  purchasePackage,
  restorePurchases,
} from '../purchases';
import { useJBBilling } from '../provider';
import { BillingPlan, BillingPlanPrice, BillingPlatform } from '../types';

export type JBPaywallScreenOverrides = {
  title?: string;
  subtitle?: string;
  trialCtaLabel?: string;
  purchaseCtaLabel?: string;
  restoreLabel?: string;
  unavailableTitle?: string;
  unavailableMessage?: string;
  retryLabel?: string;
  /** Fine print del footer. */
  legalFootnote?: string;
  /**
   * Mensaje cuando RC no expone offerings para la plataforma actual
   * (ej. Android sin productos configurados en Play Console). Se
   * muestra inline y deshabilita el botón de compra.
   */
  storeUnavailableTitle?: string;
  storeUnavailableMessage?: string;
  /**
   * Mensaje cuando hay offerings pero el price seleccionado no tiene
   * package en la store (caso raro: catálogo del backend trae un SKU
   * que aún no existe en la store).
   */
  priceUnavailableMessage?: string;
};

export type JBPaywallRestoreResult = 'restored' | 'no_purchases' | 'error';

export type JBPaywallScreenProps = {
  overrides?: JBPaywallScreenOverrides;
  onSuccess?: () => void;
  onRestore?: (result: JBPaywallRestoreResult, message?: string) => void;
  onError?: (message: string) => void;
};

type OfferingsState = {
  data: any;
  loading: boolean;
  error: string | null;
};

const useOfferings = (): OfferingsState & { refetch: () => void } => {
  const [state, setState] = useState<OfferingsState>({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    (async () => {
      try {
        const data = await getOfferings();
        if (cancelled) return;
        const current = data?.current ?? null;
        const hasPackages = Boolean(current?.availablePackages?.length);
        if (!data) {
          setState({ data: null, loading: false, error: 'sdk_unavailable' });
        } else if (!hasPackages) {
          setState({ data: null, loading: false, error: 'no_offerings' });
        } else {
          setState({ data, loading: false, error: null });
        }
      } catch (err: any) {
        if (cancelled) return;
        setState({ data: null, loading: false, error: err?.message ?? 'fetch_failed' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { ...state, refetch: () => setTick((t) => t + 1) };
};

const findPackageForPrice = (offerings: any, price: BillingPlanPrice) => {
  if (!offerings || !price.revenuecatProductId) return null;
  const current = offerings.current;
  if (!current?.availablePackages) return null;
  const target = price.revenuecatProductId;
  return (
    current.availablePackages.find((pkg: any) => {
      const candidates = [
        pkg?.product?.identifier,
        pkg?.product?.productIdentifier,
        pkg?.storeProduct?.identifier,
        pkg?.storeProduct?.productIdentifier,
      ];
      return candidates.includes(target);
    }) ?? null
  );
};

const getDisplayPrice = (pkg: any, price: BillingPlanPrice): string => {
  return (
    pkg?.product?.priceString ??
    pkg?.product?.localizedPriceString ??
    pkg?.storeProduct?.priceString ??
    pkg?.storeProduct?.localizedPriceString ??
    `$${price.amount} ${price.currency}`
  );
};

const customerInfoHasActiveEntitlements = (customerInfo: any): boolean => {
  if (!customerInfo) return false;
  const active = customerInfo?.entitlements?.active ?? {};
  return Object.keys(active).length > 0;
};

/**
 * Calcula el ahorro % del precio yearly vs monthly × 12.
 * Devuelve null si no se puede calcular (montos 0 o solo un plan).
 */
const computeYearlySavingsPercent = (prices: BillingPlanPrice[]): number | null => {
  const monthly = prices.find((p) => p.interval === 'monthly');
  const yearly = prices.find((p) => p.interval === 'yearly');
  if (!monthly || !yearly) return null;
  const m = Number(monthly.amount);
  const y = Number(yearly.amount);
  if (!m || !y) return null;
  const annual = m * 12;
  if (annual <= y) return null;
  return Math.round(((annual - y) / annual) * 100);
};

const guessPlatform = (): BillingPlatform =>
  (Platform.OS === 'ios' ? 'ios' : 'android') as BillingPlatform;

export const JBPaywallScreen: React.FC<JBPaywallScreenProps> = ({ overrides, onSuccess, onRestore, onError }) => {
  const { hooks, appUserId } = useJBBilling();
  const catalogQuery = hooks.useBillingCatalogQuery();
  const trial = useTrialInfo();
  const syncMobile = hooks.useSyncMobileMutation();
  const { data: offerings, loading: offeringsLoading, error: offeringsError, refetch: refetchOfferings } = useOfferings();

  const premiumPlan = useMemo<BillingPlan | undefined>(() => {
    const plans = catalogQuery.data?.plans ?? [];
    const byTier = plans.find((p) => (p.tier ?? '').toLowerCase() === 'premium');
    if (byTier) return byTier;
    const byPrices = plans.find((p) => (p.prices?.length ?? 0) > 0);
    return byPrices;
  }, [catalogQuery.data]);

  const premiumPrices = premiumPlan?.prices ?? [];
  const yearlySavings = useMemo(() => computeYearlySavingsPercent(premiumPrices), [premiumPrices]);

  // Default selection: prefer yearly (mejor LTV).
  const defaultSelected = useMemo(() => {
    const yearly = premiumPrices.find((p) => p.interval === 'yearly');
    return yearly?.id ?? premiumPrices[0]?.id ?? null;
  }, [premiumPrices]);

  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPriceId == null && defaultSelected != null) {
      setSelectedPriceId(defaultSelected);
    }
  }, [defaultSelected, selectedPriceId]);

  const purchasesAvailable = isPurchasesAvailable();
  const isLoadingOfferings = catalogQuery.isLoading || offeringsLoading;
  const hasCatalogPrices = premiumPrices.length > 0;
  const hasStoreOfferings = !!offerings && !offeringsError;
  const showTrialCta = trial.eligible && trial.days > 0;

  // Cuando RC no expone offerings (plataforma sin configurar, sin
  // conexión a stores, etc.), aún mostramos los planes del catálogo para
  // que el user entienda qué incluye Premium, pero deshabilitamos la
  // compra y avisamos. Esto evita el "click → error inmediato".
  const storeOfferingsMissing =
    !offeringsLoading && !hasStoreOfferings && purchasesAvailable;
  const selectedPriceObj = premiumPrices.find((p) => p.id === selectedPriceId);
  const selectedPackage =
    selectedPriceObj && hasStoreOfferings
      ? findPackageForPrice(offerings, selectedPriceObj)
      : null;
  const selectedPriceUnavailable =
    hasStoreOfferings && !!selectedPriceObj && !selectedPackage;
  const purchaseDisabled =
    purchasing ||
    !selectedPriceId ||
    storeOfferingsMissing ||
    selectedPriceUnavailable;

  const handlePurchase = async () => {
    setErrorMsg(null);
    const price = premiumPrices.find((p) => p.id === selectedPriceId);
    if (!price) return;
    const pkg = findPackageForPrice(offerings, price);
    if (!pkg) {
      // Caso común: el user ya tiene la suscripción activa en su Apple
      // ID pero el backend aún no la registró (webhook no llegó, sync
      // pendiente, etc.). StoreKit oculta products que ya posees.
      // Auto-intento de restore para destrabar el caso.
      const msg =
        'No pudimos cargar el producto. Si ya compraste antes, toca "Restaurar compras" para reactivar tu suscripción.';
      setErrorMsg(msg);
      onError?.(msg);
      return;
    }
    try {
      setPurchasing(true);
      await purchasePackage(pkg);
      // Forzar sync con backend antes de navegar — evita race con el
      // customerInfoListener del provider y garantiza grants en DB antes
      // de que la UI re-renderee como premium.
      if (appUserId) {
        try {
          await syncMobile.mutateAsync({ platform: guessPlatform(), appUserId });
        } catch (_err) {
          /* swallow — el listener del provider terminará invalidando */
        }
      }
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
    setRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      // Si hay entitlements, también forzar sync para que backend los registre.
      if (customerInfoHasActiveEntitlements(customerInfo) && appUserId) {
        try {
          await syncMobile.mutateAsync({ platform: guessPlatform(), appUserId });
        } catch (_err) {
          /* swallow */
        }
        onRestore?.('restored');
      } else {
        onRestore?.('no_purchases', 'No encontramos compras previas para restaurar.');
      }
    } catch (err: any) {
      if (err?.userCancelled) {
        setRestoring(false);
        return;
      }
      const msg = err?.message ?? 'No fue posible restaurar.';
      setErrorMsg(msg);
      onRestore?.('error', msg);
      onError?.(msg);
    } finally {
      setRestoring(false);
    }
  };

  const ctaLabel = showTrialCta
    ? overrides?.trialCtaLabel ?? `Comenzar prueba gratis (${trial.days} días)`
    : overrides?.purchaseCtaLabel ?? 'Suscribirse';
  const restoreLabel = overrides?.restoreLabel ?? 'Restaurar compras';

  const primary = getColor('primary');
  const ctaBg = primary?.[600] ?? '#047857';

  const legalFootnote =
    overrides?.legalFootnote ??
    'Renovación automática. Cancela cuando quieras desde Ajustes → Apple ID → Suscripciones. Puedes revisar Términos y Política de privacidad en finzenio.app.';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <PaywallHero
        title={overrides?.title ?? 'FinZenio Premium'}
        subtitle={overrides?.subtitle ?? 'Lleva tus finanzas al siguiente nivel.'}
        features={premiumPlan?.entitlements}
        trial={trial}
      />

      {isLoadingOfferings && !hasCatalogPrices ? (
        <Box style={styles.loaderBox}>
          <ActivityIndicator />
        </Box>
      ) : !hasCatalogPrices ? (
        <PremiumUnavailableCard
          title={overrides?.unavailableTitle}
          message={overrides?.unavailableMessage}
          retryLabel={overrides?.retryLabel}
          onRetry={() => {
            refetchOfferings();
            catalogQuery.refetch?.();
          }}
        />
      ) : (
        <VStack space="md">
          {premiumPrices.map((price) => {
            const pkg = findPackageForPrice(offerings, price);
            const displayPrice = getDisplayPrice(pkg, price);
            const isYearly = price.interval === 'yearly';
            const badge = isYearly && yearlySavings
              ? `AHORRA ${yearlySavings}%`
              : isYearly
                ? 'RECOMENDADO'
                : undefined;
            return (
              <PaywallPlanCard
                key={price.id}
                plan={premiumPlan as BillingPlan}
                price={price}
                displayPrice={displayPrice}
                selected={selectedPriceId === price.id}
                trialEligible={showTrialCta}
                trialDays={trial.days}
                badgeLabel={badge}
                onSelect={() => setSelectedPriceId(price.id)}
              />
            );
          })}

          {storeOfferingsMissing ? (
            <Box style={styles.unavailableBox}>
              <Text style={styles.unavailableTitle}>
                {overrides?.storeUnavailableTitle ??
                  'Compras no disponibles aún en esta plataforma'}
              </Text>
              <Text style={styles.unavailableMessage}>
                {overrides?.storeUnavailableMessage ??
                  'Estamos finalizando la configuración con la tienda. Vuelve a intentarlo en unos días o adquiere Premium desde otra plataforma.'}
              </Text>
            </Box>
          ) : selectedPriceUnavailable ? (
            <Text style={styles.warningInline}>
              {overrides?.priceUnavailableMessage ??
                'Este plan aún no está disponible en la tienda. Selecciona otro o vuelve más tarde.'}
            </Text>
          ) : !hasStoreOfferings && offeringsLoading ? (
            <Text style={styles.warningInline}>
              Los precios de la tienda aún están cargando. Verás el monto exacto al confirmar.
            </Text>
          ) : null}

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

          <TouchableOpacity
            style={[
              styles.primaryCta,
              { backgroundColor: ctaBg },
              purchaseDisabled && styles.primaryCtaDisabled,
            ]}
            activeOpacity={0.85}
            disabled={purchaseDisabled}
            onPress={handlePurchase}
          >
            <Text style={styles.primaryCtaText}>
              {purchasing ? 'Procesando…' : ctaLabel}
            </Text>
          </TouchableOpacity>
        </VStack>
      )}

      {purchasesAvailable ? (
        <TouchableOpacity
          style={[styles.secondaryCta, restoring && styles.secondaryCtaDisabled]}
          activeOpacity={0.7}
          disabled={restoring}
          onPress={handleRestore}
        >
          <Text style={[styles.secondaryCtaText, { color: ctaBg }]}>
            {restoring ? 'Restaurando…' : restoreLabel}
          </Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.fineprint}>{legalFootnote}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  loaderBox: { paddingVertical: 24, alignItems: 'center' },
  warningInline: {
    color: '#7A5A00',
    fontSize: 12,
    fontStyle: 'italic',
    marginVertical: 8,
    textAlign: 'center',
  },
  error: { color: '#C0392B', marginTop: 8, fontSize: 13, textAlign: 'center' },
  primaryCta: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryCtaDisabled: { opacity: 0.45 },
  unavailableBox: {
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
  },
  unavailableTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A5A00',
    marginBottom: 4,
  },
  unavailableMessage: {
    fontSize: 12,
    color: '#7A5A00',
    lineHeight: 17,
  },
  primaryCtaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
  secondaryCta: { marginTop: 14, alignItems: 'center', paddingVertical: 10 },
  secondaryCtaDisabled: { opacity: 0.55 },
  secondaryCtaText: { fontWeight: '600', fontSize: 14 },
  fineprint: {
    marginTop: 18,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
