import { ReactElement, ReactNode } from 'react';
import { Platform, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLastCreatedJBExpoConfig, resolveJBUIColor } from '../../config';
import { useColorScheme } from '../../hooks';
import { Box } from '../../ui/box';
import { getColor } from '../../utils';

export type JBMainLayoutProps = {
  children: ReactNode;
  scrollable?: boolean;
  hideTopAccent?: boolean;
  className?: string;
  classNameScrollView?: string;
  contentRoundedTop?: boolean;
  contentRoundedTopClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  footerRoundedTop?: boolean;
  footerRoundedTopClassName?: string;
  footerClassName?: string;
  footerStyle?: StyleProp<ViewStyle>;
  footerAdjustableHeight?: boolean;
  header?: ReactNode;
  onScroll?: (event: unknown) => void;
  refreshControl?: ReactElement<any, any>;
};

export const JBMainLayout = ({
  children,
  scrollable = false,
  hideTopAccent = false,
  className,
  classNameScrollView,
  contentRoundedTop = true,
  contentRoundedTopClassName = 'rounded-tl-3xl rounded-tr-3xl',
  contentContainerStyle = { paddingBottom: 120 },
  footer = null,
  footerRoundedTop = true,
  footerRoundedTopClassName = 'rounded-tl-3xl rounded-tr-3xl',
  footerClassName = '',
  footerStyle,
  footerAdjustableHeight = false,
  header = null,
  onScroll,
  refreshControl
}: JBMainLayoutProps) => {
  const baseConfig = getLastCreatedJBExpoConfig();
  const mode = useColorScheme();
  const insets = useSafeAreaInsets();
  const backgroundColors = getColor('background');
  const uiConfig = baseConfig?.ui;
  const rootBackgroundColor = resolveJBUIColor(
    uiConfig?.header?.backgroundColor,
    mode,
    mode === 'dark' ? backgroundColors[950] ?? '#121b26' : getColor('primary')?.[500] ?? '#0ea5e9'
  );
  const contentBackgroundColor = resolveJBUIColor(
    uiConfig?.main?.backgroundColor,
    mode,
    mode === 'dark' ? backgroundColors[0] ?? '#070b10' : backgroundColors.light ?? '#fbfbfb'
  );
  const footerBackgroundColor = resolveJBUIColor(
    uiConfig?.footer?.backgroundColor,
    mode,
    mode === 'dark' ? backgroundColors[950] ?? '#121b26' : '#ffffff'
  );
  const backgroundClassName = 'bg-background-light dark:bg-background-0';
  const backgroundHeaderClassName = 'bg-primary-500 dark:bg-background-950';
  const contentRoundedTopClass = contentRoundedTop ? contentRoundedTopClassName : '';
  const contentClipClass = contentRoundedTop ? 'overflow-hidden' : '';
  const footerRoundedTopClass = footerRoundedTop ? footerRoundedTopClassName : '';
  const contentContainerClassName = `flex-1 ${contentRoundedTopClass} ${contentClipClass} ${backgroundClassName}`;
  const rootAccentClassName = hideTopAccent
    ? backgroundClassName
    : backgroundHeaderClassName;
  const rootTopPaddingClassName = hideTopAccent
    ? "pt-0"
    : Platform.OS === 'android'
      ? "pt-0"
      : "pt-2";
  const rootClassName = `flex-1 ${rootAccentClassName} ${rootTopPaddingClassName} ${className ?? ''}`;
  const rootSurfaceBackgroundColor = hideTopAccent
    ? contentBackgroundColor
    : rootBackgroundColor;
  const scrollClassName = `pt-0 flex-1 ${classNameScrollView ?? ''}`;
  const footerContainerClassName = `${footerAdjustableHeight ? 'py-4' : 'min-h-[96px]'} px-8 justify-center ${footerRoundedTopClass} ${footerClassName}`;
  const androidFooterInset = Platform.OS === 'android' ? Math.max(insets.bottom, 0) : 0;

  if (scrollable) {
    return (
      <Box className={rootClassName} style={{ backgroundColor: rootSurfaceBackgroundColor }}>
        <Box className="flex-1">
          {header}
          <Box
            className={contentContainerClassName}
            style={{ backgroundColor: contentBackgroundColor }}
          >
            <ScrollView
              {...({ className: scrollClassName } as any)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={contentContainerStyle}
              style={{ backgroundColor: contentBackgroundColor }}
              onScroll={onScroll as ((event: any) => void) | undefined}
              refreshControl={refreshControl}
            >
              {children}
            </ScrollView>
            {footer ? (
              <Box
                className={footerContainerClassName}
                style={[{ backgroundColor: footerBackgroundColor }, footerStyle]}
              >
                {footer}
                {androidFooterInset > 0 ? (
                  <Box style={{ height: androidFooterInset }} />
                ) : null}
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={rootClassName} style={{ backgroundColor: rootSurfaceBackgroundColor }}>
      <Box className="flex-1">
        {header}
        <Box
          className={contentContainerClassName}
          style={{ backgroundColor: contentBackgroundColor }}
        >
          <Box className="pt-0 flex-1">
            {children}
          </Box>
          {footer ? (
            <Box
              className={footerContainerClassName}
              style={[{ backgroundColor: footerBackgroundColor }, footerStyle]}
            >
              {footer}
              {androidFooterInset > 0 ? (
                <Box style={{ height: androidFooterInset }} />
              ) : null}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
};
