import { useColorScheme as useRNColorScheme } from 'react-native';

import { useThemeStore } from '../runtime';

export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();
  const themeMode = useThemeStore((state: any) => state.mode);

  return themeMode === 'system' ? (systemScheme ?? 'dark') : themeMode;
}
