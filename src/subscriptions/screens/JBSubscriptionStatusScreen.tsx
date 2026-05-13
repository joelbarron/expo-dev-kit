import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { Box, Button, ButtonText, HStack, Heading, Text, VStack } from '../../ui';
import { getColor } from '../../utils/colors';
import { useJBBilling } from '../provider';
import { restorePurchases } from '../purchases';

export type JBSubscriptionRestoreResult = 'restored' | 'no_purchases' | 'error';

export type JBSubscriptionStatusScreenProps = {
  overrides?: {
    title?: string;
    restoreLabel?: string;
    managementLabel?: string;
    /** Override del display name del plan. Default: derivado del planSlug. */
    planDisplayName?: string;
    /** Override del label de cortesía. */
    compLabel?: string;
  };
  /** Llamado tras restore con un resultado tipado. */
  onRestore?: (result: JBSubscriptionRestoreResult, message?: string) => void;
  /** @deprecated usa `onRestore` con `result==='restored'`. */
  onRestoreSuccess?: () => void;
  onError?: (message: string) => void;
};

const MANAGEMENT_URLS = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  trialing: 'Prueba gratis',
  grace_period: 'Periodo de gracia',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  expired: 'Expirada',
  paused: 'Pausada',
};

const providerLabel = (provider?: string | null): string => {
  if (!provider) return '—';
  if (provider === 'REVENUECAT') {
    return Platform.OS === 'ios' ? 'App Store' : 'Google Play';
  }
  if (provider === 'STRIPE') return 'Web (finzenio.app)';
  return provider;
};

const formatPlanName = (planSlug?: string | null, override?: string): string => {
  if (override) return override;
  if (!planSlug) return 'Premium';
  // "finzenio.premium" → "Premium"; "finzenio.premium.monthly" → "Premium · Monthly".
  const parts = planSlug.split('.');
  if (parts.length <= 1) {
    return planSlug.charAt(0).toUpperCase() + planSlug.slice(1);
  }
  const [, tier, ...rest] = parts;
  const tierFmt = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Premium';
  if (rest.length === 0) return tierFmt;
  const restFmt = rest
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' · ');
  return `${tierFmt} · ${restFmt}`;
};

const customerInfoHasActiveEntitlements = (customerInfo: any): boolean => {
  if (!customerInfo) return false;
  const active = customerInfo?.entitlements?.active ?? {};
  return Object.keys(active).length > 0;
};

const detectCompGrant = (status: any): boolean => {
  const userEnts = status?.entitlements?.user ?? [];
  return userEnts.some((e: any) => e?.source === 'COMP');
};

type Mode = 'subscription' | 'comp' | 'none';

export const JBSubscriptionStatusScreen: React.FC<JBSubscriptionStatusScreenProps> = ({
  overrides,
  onRestore,
  onRestoreSuccess,
  onError,
}) => {
  const { hooks } = useJBBilling();
  const statusQuery = hooks.useBillingStatusQuery();
  const [restoring, setRestoring] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sub = statusQuery.data?.subscription;
  const hasComp = detectCompGrant(statusQuery.data);
  const mode: Mode = sub ? 'subscription' : hasComp ? 'comp' : 'none';

  const primary = getColor('primary');
  const accent = primary?.[600] ?? '#047857';

  const handleRestore = async () => {
    setErrorMsg(null);
    setRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      await statusQuery.refetch();
      const restored = customerInfoHasActiveEntitlements(customerInfo);
      if (restored) {
        onRestore?.('restored');
        onRestoreSuccess?.();
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

  const handleManage = () => {
    const url = Platform.OS === 'ios' ? MANAGEMENT_URLS.ios : MANAGEMENT_URLS.android;
    Linking.openURL(url);
  };

  const showManageButton = mode === 'subscription';

  return (
    <Box className="flex-1 bg-background-100 dark:bg-background-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box className="px-5 pt-2 pb-8">
        <Heading size="xl" className="text-typography-900 mb-4">
          {overrides?.title ?? 'Mi suscripción'}
        </Heading>

        {statusQuery.isLoading ? (
          <Box className="items-center py-10">
            <ActivityIndicator color={accent} />
          </Box>
        ) : mode === 'subscription' && sub ? (
          <SubscriptionCard sub={sub} overrides={overrides} />
        ) : mode === 'comp' ? (
          <CompCard overrides={overrides} />
        ) : (
          <EmptyCard />
        )}

        {errorMsg ? (
          <Text size="sm" className="mt-3" style={{ color: '#C0392B' }}>
            {errorMsg}
          </Text>
        ) : null}

        {showManageButton ? (
          <Button
            action="primary"
            variant="solid"
            size="lg"
            className="mt-5"
            onPress={handleManage}
          >
            <ButtonText>
              {overrides?.managementLabel ?? 'Administrar suscripción'}
            </ButtonText>
          </Button>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={restoring}
          onPress={handleRestore}
          style={{
            marginTop: 12,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text
            size="sm"
            style={{
              color: accent,
              fontWeight: '600',
              opacity: restoring ? 0.55 : 1,
            }}
          >
            {restoring
              ? 'Restaurando…'
              : overrides?.restoreLabel ?? 'Restaurar compras'}
          </Text>
        </TouchableOpacity>
        </Box>
      </ScrollView>
    </Box>
  );
};

/* ────────────── Sub-components ────────────── */

const SubscriptionCard: React.FC<{
  sub: any;
  overrides?: JBSubscriptionStatusScreenProps['overrides'];
}> = ({ sub, overrides }) => {
  const primary = getColor('primary');
  const accent = primary?.[600] ?? '#047857';

  const planName = formatPlanName(sub.planSlug, overrides?.planDisplayName);
  const statusLbl = STATUS_LABEL[sub.status] ?? sub.status;

  return (
    <Box
      className="rounded-2xl p-5"
      style={{ backgroundColor: accent }}
    >
      <HStack space="sm" className="items-center mb-1">
        <MaterialIcons name="workspace-premium" size={18} color="#FFFFFF" />
        <Text
          size="xs"
          style={{ color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.6 }}
        >
          FINZENIO PREMIUM
        </Text>
      </HStack>

      <Heading size="2xl" style={{ color: '#FFFFFF', marginBottom: 14 }}>
        {planName}
      </Heading>

      <VStack space="sm">
        <InfoRow icon="check-circle" label="Estado" value={statusLbl} />
        {sub.currentPeriodEnd ? (
          <InfoRow
            icon="event"
            label={sub.cancelAtPeriodEnd ? 'Termina el' : 'Renueva el'}
            value={formatDate(sub.currentPeriodEnd)}
          />
        ) : null}
        <InfoRow
          icon="store"
          label="Comprado en"
          value={providerLabel(sub.provider)}
        />
        {sub.cancelAtPeriodEnd ? (
          <Text
            size="xs"
            style={{
              color: '#FFFFFF',
              opacity: 0.85,
              fontStyle: 'italic',
              marginTop: 8,
            }}
          >
            Tu suscripción se cancelará al finalizar el periodo. Puedes
            reactivarla desde Ajustes de tu Apple ID.
          </Text>
        ) : null}
      </VStack>
    </Box>
  );
};

const CompCard: React.FC<{
  overrides?: JBSubscriptionStatusScreenProps['overrides'];
}> = ({ overrides }) => {
  const primary = getColor('primary');
  const accent = primary?.[600] ?? '#047857';

  return (
    <Box className="rounded-2xl p-5" style={{ backgroundColor: accent }}>
      <HStack space="sm" className="items-center mb-1">
        <MaterialIcons name="card-giftcard" size={18} color="#FFFFFF" />
        <Text
          size="xs"
          style={{ color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.6 }}
        >
          {overrides?.compLabel ?? 'ACCESO DE CORTESÍA'}
        </Text>
      </HStack>

      <Heading size="2xl" style={{ color: '#FFFFFF', marginBottom: 12 }}>
        Premium activo
      </Heading>

      <Text
        size="sm"
        style={{ color: '#FFFFFF', opacity: 0.92, lineHeight: 21 }}
      >
        Tienes acceso completo a Premium sin costo. Cuando termine el periodo
        se desactivará automáticamente.
      </Text>
    </Box>
  );
};

const EmptyCard: React.FC = () => {
  return (
    <Box
      className="rounded-2xl p-5 bg-background-150 dark:bg-background-100"
      style={{
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
      }}
    >
      <HStack space="sm" className="items-center mb-1">
        <MaterialIcons name="info-outline" size={18} color="#9CA3AF" />
        <Text
          size="xs"
          className="text-typography-600"
          style={{ fontWeight: '700', letterSpacing: 0.6 }}
        >
          PLAN GRATUITO
        </Text>
      </HStack>
      <Heading size="lg" className="text-typography-900 mb-1">
        No tienes una suscripción activa
      </Heading>
      <Text size="sm" className="text-typography-700">
        Si compraste Premium antes, intenta "Restaurar compras" abajo.
      </Text>
    </Box>
  );
};

const InfoRow: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}> = ({ icon, label, value }) => {
  return (
    <HStack space="sm" className="items-center">
      <MaterialIcons name={icon} size={14} color="#FFFFFF" />
      <Text
        size="sm"
        style={{ color: '#FFFFFF', opacity: 0.85, marginLeft: 4 }}
      >
        {label}:
      </Text>
      <Text size="sm" style={{ color: '#FFFFFF', fontWeight: '600', flex: 1 }}>
        {value}
      </Text>
    </HStack>
  );
};
