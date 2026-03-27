import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { getAuthAccountConfig, getLastCreatedJBExpoConfig } from '../../../config';
import { useAppConfigStore } from '../../../runtime';
import { Chip } from '../../../shared';
import { HStack } from '../../../ui';
import { useJBProfileCompletion } from '../hooks';
import { JBUserDefaultProfileScreen } from './JBUserDefaultProfileScreen';
import { JBUserPersonalDataScreen } from './JBUserPersonalDataScreen';

type AccountDataTab = 'profile' | 'access';

const resolveAccountDataTab = (value: unknown): AccountDataTab => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return 'profile';
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'access') return 'access';
  return 'profile';
};

export function JBUserAccountDataScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ tab?: string | string[] }>();
  const initialTab = resolveAccountDataTab(params?.tab);
  const [activeTab, setActiveTab] = useState<AccountDataTab>(initialTab);
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const completion = useJBProfileCompletion();

  const accountConfig = useMemo(
    () =>
      getAuthAccountConfig({
        ...baseConfig,
        auth: {
          ...baseConfig.auth,
          ...(appConfig?.auth ?? {}),
        },
      } as any),
    [appConfig, baseConfig]
  );

  const shouldLockBack = useMemo(
    () =>
      completion.enabled &&
      accountConfig.profileCompletionMode === 'enforced' &&
      !completion.isComplete,
    [accountConfig.profileCompletionMode, completion.enabled, completion.isComplete]
  );

  useEffect(() => {
    const nextTab = resolveAccountDataTab(params?.tab);
    setActiveTab((current) => (current === nextTab ? current : nextTab));
  }, [params?.tab]);

  useEffect(() => {
    if (!shouldLockBack) return;
    setActiveTab((current) => (current === 'profile' ? current : 'profile'));
  }, [shouldLockBack]);

  const headerChips = useMemo(
    () => (
      <HStack
        space="sm"
        className="items-center justify-center pr-1"
      >
        <Chip
          title="Perfil"
          className="min-w-[74px]"
          titleClassName={
            activeTab === 'profile'
              ? 'text-primary-700 font-semibold text-[10px]'
              : 'text-white font-semibold text-[10px]'
          }
          activeBgClassName="bg-white"
          inactiveBgClassName="bg-white/20"
          isActive={activeTab === 'profile'}
          onPress={() => {
            if (activeTab === 'profile') return;
            setActiveTab('profile');
          }}
        />
        <Chip
          title="Acceso"
          className="min-w-[74px]"
          titleClassName={
            activeTab === 'access'
              ? 'text-primary-700 font-semibold text-[10px]'
              : 'text-white font-semibold text-[10px]'
          }
          activeBgClassName="bg-white"
          inactiveBgClassName="bg-white/20"
          isActive={activeTab === 'access'}
          onPress={() => {
            if (activeTab === 'access') return;
            setActiveTab('access');
          }}
        />
      </HStack>
    ),
    [activeTab]
  );

  useEffect(() => {
    (navigation as any).setOptions?.({
      gestureEnabled: !shouldLockBack,
      headerLeft: shouldLockBack ? () => null : undefined,
      headerTitleAlign: 'center',
      title: shouldLockBack ? 'Completar perfil' : 'Editar datos de cuenta',
      headerRight: shouldLockBack ? undefined : () => headerChips,
    });
  }, [headerChips, navigation, shouldLockBack]);

  if (activeTab === 'access') {
    return <JBUserPersonalDataScreen showProfileCta={false} />;
  }

  return <JBUserDefaultProfileScreen showPersonalDataCta={false} />;
}
