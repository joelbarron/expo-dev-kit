import { JBPermissionKey } from '../config';

export type JBPermissionState = 'granted' | 'denied' | 'blocked' | 'unavailable';

export type JBPermissionItem = {
  key: JBPermissionKey;
  label: string;
  description: string;
  required: boolean;
  status: JBPermissionState;
};

export type JBSettingsItemType = 'action' | 'theme';

export type JBSettingsItem = {
  id: string;
  title: string;
  subtitle?: string;
  type?: JBSettingsItemType;
  disabled?: boolean;
  badge?: string;
  rightLabel?: string;
  onPress?: () => void;
};

export type JBSettingsSection = {
  id: string;
  title: string;
  items: JBSettingsItem[];
};
