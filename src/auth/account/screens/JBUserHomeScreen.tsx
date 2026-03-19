import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { JBMainLayout } from '../../../core';
import { useColorScheme } from '../../../hooks';
import { ConfirmationDialog } from '../../../shared';
import { Box, HStack, Text, VStack } from '../../../ui';
import { getColor } from '../../../utils';

type DialogActionColor = 'default' | 'primary' | 'secondary' | 'positive' | 'negative';

export type JBUserHomeMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  iconName?: React.ComponentProps<typeof MaterialIcons>['name'];
  href?: string;
  onPress?: () => void | Promise<void>;
  visible?: boolean;
  confirmation?: {
    title?: string;
    content?: string;
    agreeText?: string;
    agreeColor?: DialogActionColor;
    disagreeText?: string;
    disagreeColor?: DialogActionColor;
  };
};

export type JBUserHomeDefaultOptions = {
  includeAccountSecurity?: boolean;
  includeNotifications?: boolean;
  includeSettings?: boolean;
  includeSignOut?: boolean;
  signOutPath?: string;
};

export type JBUserHomeScreenProps = {
  basePath?: string;
  header?: React.ReactNode;
  options?: Array<JBUserHomeMenuItem>;
  extraOptions?: Array<JBUserHomeMenuItem>;
  includeDefaultOptions?: boolean;
  defaultOptions?: JBUserHomeDefaultOptions;
  className?: string;
  classNameScrollView?: string;
};

type NormalizedDefaultOptions = Required<JBUserHomeDefaultOptions>;

const defaultMenuOptions: NormalizedDefaultOptions = {
  includeAccountSecurity: true,
  includeNotifications: false,
  includeSettings: true,
  includeSignOut: true,
  signOutPath: '/sign-out',
};

export const createJBUserHomeDefaultOptions = (
  basePath = '/user',
  options?: JBUserHomeDefaultOptions
): Array<JBUserHomeMenuItem> => {
  const resolved: NormalizedDefaultOptions = {
    ...defaultMenuOptions,
    ...(options ?? {}),
  };
  const items: Array<JBUserHomeMenuItem> = [];

  if (resolved.includeAccountSecurity) {
    items.push({
      id: 'account-security',
      title: 'Cuenta y seguridad',
      subtitle: 'Perfiles, foto, contraseña y datos de la cuenta',
      iconName: 'security',
      href: `${basePath}/account-security`,
    });
  }

  if (resolved.includeNotifications) {
    items.push({
      id: 'notifications',
      title: 'Notificaciones',
      subtitle: 'Revisa lo mas reciente de tu actividad',
      iconName: 'notifications-none',
      href: '/notifications',
    });
  }

  if (resolved.includeSettings) {
    items.push({
      id: 'settings',
      title: 'Configuracion',
      subtitle: 'Preferencias y ajustes de la aplicacion',
      iconName: 'settings',
      href: '/settings',
    });
  }

  if (resolved.includeSignOut) {
    items.push({
      id: 'sign-out',
      title: 'Cerrar sesion',
      subtitle: 'Salir de tu cuenta',
      iconName: 'logout',
      href: resolved.signOutPath,
      confirmation: {
        title: 'Cerrar sesion',
        content: 'Estas seguro de que deseas cerrar sesion?',
        agreeText: 'Si, cerrar sesion',
        agreeColor: 'primary',
        disagreeText: 'Cancelar',
        disagreeColor: 'negative',
      },
    });
  }

  return items;
};

const UserOptionRow = ({
  item,
  onPress,
}: {
  item: JBUserHomeMenuItem;
  onPress: (item: JBUserHomeMenuItem) => void;
}) => {
  const colorScheme = useColorScheme();
  const typographyColor = getColor('typography');
  const iconColor = colorScheme === 'dark' ? typographyColor[900] : typographyColor.black;
  const chevronColor = getColor('muted');
  const optionIconName = item.iconName ?? 'chevron-right';

  return (
    <TouchableOpacity onPress={() => onPress(item)}>
      <HStack className="w-full items-center justify-between p-4">
        <HStack space="sm" className="flex-1 items-center pr-3">
          <MaterialIcons name={optionIconName} size={35} color={iconColor} className="mr-3" />
          <VStack className="flex-1">
            <Text bold size="lg">
              {item.title}
            </Text>
            <Text size="md">{item.subtitle}</Text>
          </VStack>
        </HStack>
        <MaterialIcons name="chevron-right" size={35} color={chevronColor} className="mr-3" />
      </HStack>
    </TouchableOpacity>
  );
};

export function JBUserHomeScreen({
  basePath = '/user',
  header,
  options,
  extraOptions = [],
  includeDefaultOptions = true,
  defaultOptions,
  className,
  classNameScrollView,
}: JBUserHomeScreenProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<JBUserHomeMenuItem | null>(null);

  const menuOptions = useMemo(() => {
    const baseItems = Array.isArray(options)
      ? options
      : includeDefaultOptions
        ? createJBUserHomeDefaultOptions(basePath, defaultOptions)
        : [];
    return [...baseItems, ...extraOptions].filter((item) => item?.visible !== false);
  }, [basePath, defaultOptions, extraOptions, includeDefaultOptions, options]);

  const runOptionAction = async (item: JBUserHomeMenuItem) => {
    if (typeof item.onPress === 'function') {
      await item.onPress();
      return;
    }

    if (item.href) {
      router.push(item.href as any);
    }
  };

  const handleOptionPress = async (item: JBUserHomeMenuItem) => {
    if (item.confirmation) {
      setSelectedOption(item);
      return;
    }
    await runOptionAction(item);
  };

  const handleAgreeConfirmation = async () => {
    if (!selectedOption) {
      return;
    }
    await runOptionAction(selectedOption);
    setSelectedOption(null);
  };

  const handleCloseConfirmation = () => {
    setSelectedOption(null);
  };

  return (
    <>
      <JBMainLayout
        scrollable
        className={className ?? 'flex-1 bg-primary-500'}
        classNameScrollView={classNameScrollView ?? 'flex-1'}
        header={header}
      >
        <Box className="pt-4">
          <VStack space="md">
            {menuOptions.map((item) => (
              <UserOptionRow key={item.id} item={item} onPress={(value) => void handleOptionPress(value)} />
            ))}
          </VStack>
        </Box>
      </JBMainLayout>

      <ConfirmationDialog
        open={Boolean(selectedOption)}
        setOpen={(open) => {
          if (!open) {
            setSelectedOption(null);
          }
        }}
        showIcon={false}
        title={selectedOption?.confirmation?.title ?? 'Cerrar sesion'}
        content={selectedOption?.confirmation?.content ?? 'Estas seguro de que deseas continuar?'}
        agreeText={selectedOption?.confirmation?.agreeText ?? 'Aceptar'}
        agreeColor={selectedOption?.confirmation?.agreeColor ?? 'primary'}
        disagreeText={selectedOption?.confirmation?.disagreeText ?? 'Cancelar'}
        disagreeColor={selectedOption?.confirmation?.disagreeColor ?? 'negative'}
        disagreeTextButtonClassName="text-red-500"
        onAgree={() => void handleAgreeConfirmation()}
        onDisAgree={handleCloseConfirmation}
      />
    </>
  );
}
