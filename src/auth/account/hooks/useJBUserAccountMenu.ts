import { useMemo } from 'react';

import { getAuthAccountConfig, getLastCreatedJBExpoConfig } from '../../../config';
import { useAppConfigStore } from '../../../runtime';
import { JBUserHomeDefaultOptions, JBUserHomeMenuId, JBUserHomeMenuItem } from '../types';

type UseJBUserAccountMenuArgs = {
  basePath?: string;
  options?: Array<JBUserHomeMenuItem>;
  extraOptions?: Array<JBUserHomeMenuItem>;
  includeDefaultOptions?: boolean;
  defaultOptions?: JBUserHomeDefaultOptions;
};

const defaultLegacyOptions: Required<JBUserHomeDefaultOptions> = {
  includeAccountSecurity: true,
  includeNotifications: false,
  includeSettings: true,
  includeSignOut: true,
  signOutPath: '/sign-out',
};

const defaultMenuItemOrder: JBUserHomeMenuId[] = ['security', 'paymentMethods', 'settings', 'signOut', 'notifications'];

export const createJBUserHomeDefaultOptions = (
  basePath = '/user',
  options?: JBUserHomeDefaultOptions
): Array<JBUserHomeMenuItem> => {
  const resolved = {
    ...defaultLegacyOptions,
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

const getConfiguredDefaultMenuItems = ({
  basePath,
  signOutPath,
}: {
  basePath: string;
  signOutPath: string;
}): Record<JBUserHomeMenuId, JBUserHomeMenuItem> => ({
  security: {
    id: 'account-security',
    title: 'Cuenta y seguridad',
    subtitle: 'Perfiles, foto, contraseña y datos de la cuenta',
    iconName: 'security',
    href: `${basePath}/account-security`,
  },
  paymentMethods: {
    id: 'payment-methods',
    title: 'Metodos de pago',
    subtitle: 'Configura tus metodos de pago',
    iconName: 'credit-card',
    href: '/payments/payment-methods/list',
  },
  settings: {
    id: 'settings',
    title: 'Configuracion',
    subtitle: 'Preferencias y ajustes de la aplicacion',
    iconName: 'settings',
    href: '/settings',
  },
  signOut: {
    id: 'sign-out',
    title: 'Cerrar sesion',
    subtitle: 'Salir de tu cuenta',
    iconName: 'logout',
    href: signOutPath,
    confirmation: {
      title: 'Cerrar sesion',
      content: 'Estas seguro de que deseas cerrar sesion?',
      agreeText: 'Si, cerrar sesion',
      agreeColor: 'primary',
      disagreeText: 'Cancelar',
      disagreeColor: 'negative',
    },
  },
  notifications: {
    id: 'notifications',
    title: 'Notificaciones',
    subtitle: 'Revisa lo mas reciente de tu actividad',
    iconName: 'notifications-none',
    href: '/notifications',
  },
});

const resolveLegacyIncludes = (options?: JBUserHomeDefaultOptions): JBUserHomeMenuId[] => {
  const resolved = {
    ...defaultLegacyOptions,
    ...(options ?? {}),
  };
  const items: JBUserHomeMenuId[] = [];
  if (resolved.includeAccountSecurity) items.push('security');
  if (resolved.includeNotifications) items.push('notifications');
  if (resolved.includeSettings) items.push('settings');
  if (resolved.includeSignOut) items.push('signOut');
  return items;
};

const applyMenuOrdering = (
  items: JBUserHomeMenuItem[],
  orderedIds: JBUserHomeMenuId[]
): JBUserHomeMenuItem[] => {
  const itemIdToMenuId: Record<string, JBUserHomeMenuId> = {
    'account-security': 'security',
    'payment-methods': 'paymentMethods',
    settings: 'settings',
    'sign-out': 'signOut',
    notifications: 'notifications',
  };
  const rank = new Map<string, number>();
  orderedIds.forEach((menuId, index) => {
    rank.set(menuId, index);
  });

  return [...items].sort((left, right) => {
    const leftMenuId = itemIdToMenuId[left.id] ?? null;
    const rightMenuId = itemIdToMenuId[right.id] ?? null;
    const leftRank = leftMenuId ? (rank.get(leftMenuId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    const rightRank = rightMenuId ? (rank.get(rightMenuId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return 0;
  });
};

export const useJBUserAccountMenu = ({
  basePath = '/user',
  options,
  extraOptions = [],
  includeDefaultOptions = true,
  defaultOptions,
}: UseJBUserAccountMenuArgs): Array<JBUserHomeMenuItem> => {
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);

  return useMemo(() => {
    if (Array.isArray(options)) {
      return [...options, ...extraOptions].filter((item) => item?.visible !== false);
    }

    if (!includeDefaultOptions) {
      return [...extraOptions].filter((item) => item?.visible !== false);
    }

    const mergedConfig = {
      ...baseConfig,
      auth: {
        ...baseConfig.auth,
        ...(appConfig?.auth ?? {}),
      },
    };
    const accountConfig = getAuthAccountConfig(mergedConfig as any);
    const legacyResolved = {
      ...defaultLegacyOptions,
      ...(defaultOptions ?? {}),
    };
    const configuredMenu = accountConfig.menu ?? {};
    const include = configuredMenu.include?.length
      ? configuredMenu.include
      : resolveLegacyIncludes(legacyResolved);
    const order = configuredMenu.order?.length ? configuredMenu.order : include;
    const defaultItems = getConfiguredDefaultMenuItems({
      basePath,
      signOutPath: legacyResolved.signOutPath,
    });
    const mappedDefaults = include
      .map((menuId) => {
        const baseItem = defaultItems[menuId];
        if (!baseItem) {
          return null;
        }
        const override = configuredMenu.overrides?.[menuId];
        const confirmationOverride = configuredMenu.confirmations?.[menuId];
        return {
          ...baseItem,
          ...(override ?? {}),
          confirmation: confirmationOverride
            ? {
                ...(baseItem.confirmation ?? {}),
                ...confirmationOverride,
              }
            : (override?.confirmation ?? baseItem.confirmation),
        } as JBUserHomeMenuItem;
      })
      .filter(Boolean) as JBUserHomeMenuItem[];

    const sortedDefaults = applyMenuOrdering(
      mappedDefaults,
      order.length ? order : defaultMenuItemOrder
    );

    return [...sortedDefaults, ...extraOptions].filter((item) => item?.visible !== false);
  }, [
    appConfig?.auth,
    baseConfig,
    basePath,
    defaultOptions,
    extraOptions,
    includeDefaultOptions,
    options,
  ]);
};
