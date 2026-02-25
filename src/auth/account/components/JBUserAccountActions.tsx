import React from 'react';
import { Link } from 'expo-router';
import { TouchableOpacity } from 'react-native';

import { Box, HStack, Text, VStack } from '../../../ui';
import { useJBUserAccountCapabilities } from '../hooks/useJBUserAccountCapabilities';

type JBUserAccountActionsProps = {
  basePath?: string;
  title?: string;
  className?: string;
};

const ActionRow = ({ title, subtitle, href }: { title: string; subtitle: string; href: string }) => (
  <Link href={href as any} asChild>
    <TouchableOpacity>
      <Box className="rounded-2xl border border-outline-200 bg-background-100 px-4 py-4">
        <VStack space="xs">
          <Text bold size="md" className="text-white">{title}</Text>
          <Text size="sm" className="text-typography-300">{subtitle}</Text>
        </VStack>
      </Box>
    </TouchableOpacity>
  </Link>
);

export const JBUserAccountActions = ({
  basePath = '/user',
  title = 'Cuenta y seguridad',
  className = '',
}: JBUserAccountActionsProps) => {
  const capabilities = useJBUserAccountCapabilities();

  if (!capabilities.showAccountSection) {
    return null;
  }

  return (
    <VStack space="md" className={className}>
      <HStack className="items-center justify-between">
        <Text bold size="lg" className="text-white">{title}</Text>
      </HStack>

      {capabilities.canSeeProfiles ? (
        <ActionRow
          title="Perfiles"
          subtitle="Consulta y cambia el perfil activo"
          href={`${basePath}/profiles`}
        />
      ) : null}

      {capabilities.canCreateProfile ? (
        <ActionRow
          title="Crear perfil"
          subtitle="Agregar un nuevo perfil a tu cuenta"
          href={`${basePath}/profiles/create`}
        />
      ) : null}

      {capabilities.canChangePhoto ? (
        <ActionRow
          title="Cambiar foto de perfil"
          subtitle="Actualiza tu avatar"
          href={`${basePath}/photo`}
        />
      ) : null}

      {capabilities.canEditPersonalData ? (
        <ActionRow
          title="Editar datos"
          subtitle="Modifica correo, usuario y más"
          href={`${basePath}/personal-data`}
        />
      ) : null}

      {capabilities.canChangePassword ? (
        <ActionRow
          title="Cambiar contraseña"
          subtitle="Actualiza tu contraseña de acceso"
          href={`${basePath}/change-password`}
        />
      ) : null}
    </VStack>
  );
};
