declare module 'expo-splash-screen' {
  export function preventAutoHideAsync(): Promise<boolean>;
  export function hideAsync(): Promise<boolean>;
}

declare module 'expo-status-bar' {
  import * as React from 'react';

  export type StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark';

  export const StatusBar: React.ComponentType<{
    style?: StatusBarStyle;
  }>;
}
