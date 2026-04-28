import React, { useEffect, useMemo } from 'react';
import { config } from './config';
import { View, ViewProps } from 'react-native';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';
import { useColorScheme, vars } from 'nativewind';

export type ModeType = 'light' | 'dark' | 'system';

export type ThemeVarsOverride = Record<string, string>;

export type ThemeOverrides = {
  light?: ThemeVarsOverride;
  dark?: ThemeVarsOverride;
};

export function GluestackUIProvider({
  mode = 'light',
  themeOverrides,
  ...props
}: {
  mode?: ModeType;
  themeOverrides?: ThemeOverrides;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const overrideStyle = useMemo(() => {
    const override = themeOverrides?.[colorScheme as 'light' | 'dark'];
    return override ? vars(override) : null;
  }, [themeOverrides, colorScheme]);

  return (
    <View
      style={[
        config[colorScheme!],
        overrideStyle,
        { flex: 1, height: '100%', width: '100%' },
        props.style,
      ]}
    >
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
