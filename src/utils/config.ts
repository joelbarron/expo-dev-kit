import { Appearance } from 'react-native';

import { useThemeStore } from '../runtime';

export const getColorScheme = () => {
  const mode = useThemeStore.getState().mode;
  if (mode === 'system') {
    return Appearance.getColorScheme() ?? 'dark';
  }
  return mode;
};
