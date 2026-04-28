import React from 'react';
import { Link } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native';

import {
  getAuthRoutesConfig,
  getLastCreatedJBExpoConfig,
  getSettingsConfig,
} from '../../../config';
import { useColorScheme } from '../../../hooks';
import { useAppConfigStore } from '../../../runtime';
import { Box, HStack, Text, VStack } from '../../../ui';
import { getColor } from '../../../utils';
import { useJBUserAccountCapabilities } from '../hooks/useJBUserAccountCapabilities';

type JBUserAccountActionsProps = {
  basePath?: string;
  title?: string;
  className?: string;
};

const ActionRow = ({
  title,
  subtitle,
  href,
  iconName,
}: {
  title: string;
  subtitle: string;
  href: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}) => {
  const scheme = useColorScheme();
  const primary = getColor('primary') ?? {};
  const typography = getColor('typography') ?? {};
  const iconColor =
    scheme === 'dark'
      ? primary[300] ?? '#67e8f9'
      : primary[600] ?? '#0891b2';
  const chevronColor =
    scheme === 'dark'
      ? typography[300] ?? '#cbd5e1'
      : typography[500] ?? '#64748b';

  return (
    <Link href={href as any} asChild>
      <TouchableOpacity activeOpacity={0.9}>
        <HStack className="items-center rounded-2xl bg-background-150 px-4 py-4 dark:bg-background-200">
          <Box className="h-10 w-10 items-center justify-center rounded-full bg-primary-500/15">
            <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
          </Box>
          <VStack className="ml-3 flex-1" space="xs">
            <Text bold size="md" className="text-typography-900">
              {title}
            </Text>
            <Text size="sm" className="text-typography-500">
              {subtitle}
            </Text>
          </VStack>
          <MaterialCommunityIcons name="chevron-right" size={22} color={chevronColor} />
        </HStack>
      </TouchableOpacity>
    </Link>
  );
};

export const JBUserAccountActions = ({
  basePath,
  title,
  className = '',
}: JBUserAccountActionsProps) => {
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const capabilities = useJBUserAccountCapabilities();
  const authRoutes = getAuthRoutesConfig({
    ...baseConfig,
    auth: {
      ...baseConfig.auth,
      ...(appConfig?.auth ?? {}),
    },
  } as any);
  const resolvedBasePath = String(basePath ?? '').trim() || authRoutes.userBasePath;
  const settingsConfig = getSettingsConfig({
    ...baseConfig,
    settings: {
      ...(baseConfig.settings ?? {}),
      ...(appConfig?.settings ?? {}),
    },
  } as any);
  const biometricsPath = String(
    settingsConfig.security?.biometricsPath ?? ''
  ).trim();
  const canOpenBiometricsSettings = Boolean(
    settingsConfig.security?.biometricsEnabled && biometricsPath
  );

  if (!capabilities.showAccountSection) {
    return null;
  }

  return (
    <VStack space="md" className={className}>
      {title ? (
        <HStack className="items-center justify-between">
          <Text bold size="lg" className="text-typography-900">
            {title}
          </Text>
        </HStack>
      ) : null}

      {capabilities.canChangePhoto ? (
        <ActionRow
          title="Cambiar foto de perfil"
          subtitle="Actualiza tu avatar"
          href={`${resolvedBasePath}/photo`}
          iconName="camera-outline"
        />
      ) : null}

      {capabilities.canEditDefaultProfile || capabilities.canEditPersonalData ? (
        <ActionRow
          title="Editar datos de cuenta"
          subtitle="Actualiza perfil, correo, teléfono y usuario"
          href={`${resolvedBasePath}/account-data`}
          iconName="card-account-details-outline"
        />
      ) : null}

      {capabilities.canChangePassword ? (
        <ActionRow
          title="Cambiar contraseña"
          subtitle="Actualiza tu contraseña de acceso"
          href={`${resolvedBasePath}/change-password`}
          iconName="lock-outline"
        />
      ) : null}

      {canOpenBiometricsSettings ? (
        <ActionRow
          title="Desbloqueo biométrico"
          subtitle="Configura Face ID, Touch ID o huella de acceso"
          href={biometricsPath}
          iconName="fingerprint"
        />
      ) : null}

      {capabilities.canSeeProfiles ? (
        <ActionRow
          title="Perfiles adicionales"
          subtitle="Gestionar perfiles adicionales de la cuenta"
          href={`${resolvedBasePath}/profiles`}
          iconName="account-switch-outline"
        />
      ) : null}
    </VStack>
  );
};
