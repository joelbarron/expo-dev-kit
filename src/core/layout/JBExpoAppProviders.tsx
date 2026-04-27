import { Theme, ThemeProvider } from '@react-navigation/native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import React, { ReactNode, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, { ToastConfig, ToastProps } from 'react-native-toast-message';

import { createExpoQueryClient, CreateExpoQueryClientOptions } from '../../query/createQueryClient';
import { GluestackUIProvider, ModeType, ThemeOverrides } from '../../ui/gluestack-ui-provider';
import { FullScreenToastProvider } from '../toast/FullScreenToast';
import { toastConfig as defaultToastConfig } from '../toast/toastConfig';
import { JBAppMeta, JBAppMetaProvider } from './appMeta';

export type JBExpoAppProvidersProps = {
  children: ReactNode;
  colorMode?: ModeType;
  navigationTheme?: Theme;
  queryClient?: QueryClient;
  queryClientOptions?: CreateExpoQueryClientOptions;
  withFullScreenToast?: boolean;
  withToast?: boolean;
  toastConfig?: ToastConfig;
  toastPosition?: ToastProps['position'];
  gestureHandlerRootStyle?: StyleProp<ViewStyle>;
  appMeta?: JBAppMeta;
  themeOverrides?: ThemeOverrides;
};

export function JBExpoAppProviders({
  children,
  colorMode = 'system',
  navigationTheme,
  queryClient,
  queryClientOptions,
  withFullScreenToast = true,
  withToast = true,
  toastConfig,
  toastPosition = 'bottom',
  gestureHandlerRootStyle = { flex: 1 },
  appMeta,
  themeOverrides
}: JBExpoAppProvidersProps) {
  const queryClientRef = useRef<QueryClient | null>(null);

  if (!queryClient && !queryClientRef.current) {
    queryClientRef.current = createExpoQueryClient(queryClientOptions);
  }

  const resolvedQueryClient = queryClient ?? (queryClientRef.current as QueryClient);

  let content = children;

  if (withFullScreenToast) {
    content = <FullScreenToastProvider>{content}</FullScreenToastProvider>;
  }

  if (navigationTheme) {
    content = <ThemeProvider value={navigationTheme}>{content}</ThemeProvider>;
  }

  return (
    <GestureHandlerRootView style={gestureHandlerRootStyle}>
      <BottomSheetModalProvider>
        <QueryClientProvider client={resolvedQueryClient}>
          <GluestackUIProvider mode={colorMode} themeOverrides={themeOverrides}>
            <JBAppMetaProvider value={appMeta}>{content}</JBAppMetaProvider>
          </GluestackUIProvider>
        </QueryClientProvider>

        {withToast ? <Toast config={toastConfig ?? defaultToastConfig} position={toastPosition} /> : null}
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
