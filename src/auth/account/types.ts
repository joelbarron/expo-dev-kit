import { MaterialIcons } from '@expo/vector-icons';
import type React from 'react';

export type JBUserDialogActionColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'positive'
  | 'negative';

export type JBUserHomeMenuItemConfirmation = {
  title?: string;
  content?: string;
  agreeText?: string;
  agreeColor?: JBUserDialogActionColor;
  disagreeText?: string;
  disagreeColor?: JBUserDialogActionColor;
};

export type JBUserHomeMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  iconName?: React.ComponentProps<typeof MaterialIcons>['name'];
  href?: string;
  onPress?: () => void | Promise<void>;
  visible?: boolean;
  confirmation?: JBUserHomeMenuItemConfirmation;
};

export type JBUserHomeDefaultOptions = {
  includeAccountSecurity?: boolean;
  includeNotifications?: boolean;
  includeSettings?: boolean;
  includeSignOut?: boolean;
  signOutPath?: string;
};

export type JBUserHomeMenuId =
  | 'security'
  | 'paymentMethods'
  | 'subscription'
  | 'settings'
  | 'signOut'
  | 'notifications';
