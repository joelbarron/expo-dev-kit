import { useCallback, useEffect, useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';

import { JBFormButton } from '../../../forms';
import { Box, HStack, Text, VStack } from '../../../ui';
import { parseAuthError } from '../../forms/errorParser';
import { useJBAuth } from '../../provider';
import { AuthScreenLayout } from '../../ui';

type SocialAccountRecord = {
  provider: string;
  email?: string | null;
  linkedAt?: string | null;
};

const normalizeSocialAccounts = (raw: unknown): SocialAccountRecord[] => {
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as any).results)
      ? (raw as any).results
      : [];

  return rows
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => ({
      provider: String(item.provider ?? 'unknown'),
      email: item.email ?? null,
      linkedAt: item.linkedAt ?? item.linked_at ?? null,
    }));
};

const formatProviderLabel = (provider: string): string => {
  if (provider.toLowerCase() === 'google') return 'Google';
  if (provider.toLowerCase() === 'facebook') return 'Facebook';
  if (provider.toLowerCase() === 'apple') return 'Apple';
  return provider;
};

export function JBUserSocialAccountsScreen() {
  const auth = useJBAuth();
  const [accounts, setAccounts] = useState<SocialAccountRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await auth.getAccountSocialAccounts();
      setAccounts(normalizeSocialAccounts(response));
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'No se pudieron cargar las cuentas',
        text2: parsed.rootMessage || 'Intenta de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const unlinkAccount = useCallback(
    async (provider: string) => {
      setUnlinkingProvider(provider);
      try {
        await auth.unlinkSocial({ provider });
        Toast.show({
          type: 'success',
          text1: `${formatProviderLabel(provider)} desvinculado`,
        });
        await loadAccounts();
      } catch (error) {
        const parsed = parseAuthError(error);
        Toast.show({
          type: 'error',
          text1: 'No se pudo desvincular',
          text2: parsed.rootMessage || 'Intenta de nuevo.',
        });
      } finally {
        setUnlinkingProvider(null);
      }
    },
    [auth, loadAccounts]
  );

  const hasAccounts = accounts.length > 0;
  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => a.provider.localeCompare(b.provider)),
    [accounts]
  );

  return (
    <AuthScreenLayout
      title="Cuentas sociales"
      subtitle="Consulta y desvincula proveedores sociales conectados a tu cuenta."
    >
      <Box className="w-full">
        <VStack space="md">
          <JBFormButton
            variant="outline"
            action="primary"
            text="Refrescar"
            onPress={() => void loadAccounts()}
            loading={isLoading}
          />

          {!isLoading && !hasAccounts ? (
            <Text size="sm" className="text-typography-300">
              No hay cuentas sociales vinculadas.
            </Text>
          ) : null}

          {sortedAccounts.map((account) => (
            <Box
              key={`${account.provider}-${account.email ?? 'no-email'}`}
              className="rounded-2xl border border-outline-200 bg-background-100 p-4"
            >
              <VStack space="sm">
                <HStack className="items-center justify-between">
                  <Text size="md" className="font-semibold text-typography-900">
                    {formatProviderLabel(account.provider)}
                  </Text>
                </HStack>

                <Text size="sm" className="text-typography-600">
                  {account.email || 'Sin correo asociado'}
                </Text>
                {account.linkedAt ? (
                  <Text size="xs" className="text-typography-400">
                    Vinculado: {account.linkedAt}
                  </Text>
                ) : null}

                <JBFormButton
                  variant="outline"
                  action="negative"
                  text="Desvincular"
                  loading={unlinkingProvider === account.provider}
                  isDisabled={Boolean(unlinkingProvider)}
                  onPress={() => void unlinkAccount(account.provider)}
                />
              </VStack>
            </Box>
          ))}
        </VStack>
      </Box>
    </AuthScreenLayout>
  );
}
