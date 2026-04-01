import React from 'react';
import { Platform } from 'react-native';

import {
  getLastCreatedJBExpoConfig,
  getUIHeaderConfig,
  resolveJBUIColor,
} from '../../config';
import type { JBAppConfig, JBUIHeaderConfig } from '../../config';
import { getColor } from '../../utils';
import { JBStackHeader } from './JBStackHeader';

type JBHeaderProps = {
  navigation: any;
  route: any;
  options: any;
  back?: {
    title?: string;
  };
};

export type JBStackHeaderSlotContext = {
  canGoBack: boolean;
  title: string;
  routeName: string;
  tintColor: string;
  navigation: any;
  route: any;
  options: any;
};

export type JBCreateStackScreenOptionsParams = {
  config?: JBAppConfig;
  mode?: 'light' | 'dark';
  leftSlot?: (context: JBStackHeaderSlotContext) => React.ReactNode;
  rightSlot?: (context: JBStackHeaderSlotContext) => React.ReactNode;
  titleAlign?: 'left' | 'center';
  allowBackButton?: boolean;
};

const resolveHeaderTitle = (route: any, options: any): string => {
  if (
    options &&
    Object.prototype.hasOwnProperty.call(options, 'headerTitle') &&
    typeof options?.headerTitle === 'string'
  ) {
    return options.headerTitle;
  }
  if (typeof options?.title === 'string' && options.title.trim()) {
    return options.title.trim();
  }
  return String(route?.name ?? '').trim();
};

const resolveMinContentHeight = (headerConfig: JBUIHeaderConfig): number => {
  const value = Number(headerConfig?.minContentHeight);
  if (!Number.isFinite(value) || value <= 0) {
    return 52;
  }
  return value;
};

const resolvePaddingHorizontal = (headerConfig: JBUIHeaderConfig): number => {
  const value = Number(headerConfig?.paddingHorizontal);
  if (!Number.isFinite(value) || value < 0) {
    return 16;
  }
  return value;
};

export const createJBStackScreenOptions = ({
  config,
  mode: providedMode,
  leftSlot,
  rightSlot,
  titleAlign,
  allowBackButton = true,
}: JBCreateStackScreenOptionsParams = {}) => {
  const resolvedConfig = config ?? getLastCreatedJBExpoConfig();
  const mode = providedMode === 'dark' ? 'dark' : 'light';
  const headerConfig = getUIHeaderConfig(resolvedConfig);
  const headerMode = headerConfig.mode === 'custom' ? 'custom' : 'native';
  const backgroundColors = getColor('background');
  const primaryColor = getColor('primary');

  const backgroundColor = resolveJBUIColor(
    headerConfig.backgroundColor,
    mode,
    mode === 'dark'
      ? backgroundColors[950] ?? '#121b26'
      : primaryColor[500] ?? '#0ea5e9',
  );
  const tintColor = resolveJBUIColor(
    headerConfig.tintColor,
    mode,
    '#ffffff',
  );
  const minContentHeight = resolveMinContentHeight(headerConfig);
  const paddingHorizontal = resolvePaddingHorizontal(headerConfig);
  const resolvedTitleAlign =
    titleAlign ?? (headerConfig.titleAlign === 'left' ? 'left' : 'center');

  const baseOptions: Record<string, unknown> = {
    headerShown: true,
    headerShadowVisible: false,
    headerTintColor: tintColor,
    headerStyle: {
      backgroundColor,
    },
    headerTitleStyle: {
      fontSize: 20,
      fontWeight: '600',
    },
    statusBarStyle:
      Platform.OS === 'android'
        ? tintColor === '#ffffff'
          ? 'light'
          : 'dark'
        : undefined,
    statusBarTranslucent: Platform.OS === 'android' ? false : undefined,
    statusBarBackgroundColor:
      Platform.OS === 'android' ? backgroundColor : undefined,
  };

  if (headerMode !== 'custom') {
    return baseOptions;
  }

  return {
    ...baseOptions,
    header: ({ navigation, route, options, back }: JBHeaderProps) => {
      const canGoBack = Boolean(back) && allowBackButton;
      const resolvedTitle = resolveHeaderTitle(route, options);
      const routeName = String(route?.name ?? '').trim();
      const context: JBStackHeaderSlotContext = {
        canGoBack,
        title: resolvedTitle,
        routeName,
        tintColor,
        navigation,
        route,
        options,
      };
      const optionLeft =
        typeof options?.headerLeft === 'function'
          ? options.headerLeft({
              tintColor,
              canGoBack,
              label: back?.title,
            })
          : null;
      const optionRight =
        typeof options?.headerRight === 'function'
          ? options.headerRight({
              tintColor,
              canGoBack,
            })
          : null;

      const finalLeftSlot =
        typeof leftSlot === 'function' ? leftSlot(context) : optionLeft;
      const finalRightSlot =
        typeof rightSlot === 'function' ? rightSlot(context) : optionRight;
      const shouldCenterTitle =
        (options?.headerTitleAlign ?? resolvedTitleAlign) !== 'left';

      return (
        <JBStackHeader
          title={resolvedTitle}
          canGoBack={canGoBack}
          onBack={() => {
            if (canGoBack && typeof navigation?.goBack === 'function') {
              navigation.goBack();
            }
          }}
          leftSlot={finalLeftSlot}
          rightSlot={finalRightSlot}
          centerTitle={shouldCenterTitle}
          backgroundColor={backgroundColor}
          tintColor={tintColor}
          minContentHeight={minContentHeight}
          paddingHorizontal={paddingHorizontal}
          backIcon={headerConfig.backIcon}
        />
      );
    },
  };
};
