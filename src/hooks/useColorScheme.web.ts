import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useThemeStore } from '../runtime';

export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const themeMode = useThemeStore((state: any) => state.mode);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (themeMode !== 'system') {
    return themeMode;
  }

  if (hasHydrated) {
    return colorScheme ?? 'light';
  }

  return 'light';
}
