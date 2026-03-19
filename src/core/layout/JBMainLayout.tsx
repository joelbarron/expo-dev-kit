import { ReactElement, ReactNode } from 'react';
import { ScrollView, StyleProp, ViewStyle } from 'react-native';

import { getLastCreatedJBExpoConfig, resolveJBUIColor } from '../../config';
import { useColorScheme } from '../../hooks';
import { getColor } from '../../utils';
import { Box } from '../../ui/box';

export type JBMainLayoutProps = {
  children: ReactNode;
  scrollable?: boolean;
  className?: string;
  classNameScrollView?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
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
  className,
  classNameScrollView,
  contentContainerStyle = { paddingBottom: 120 },
  footer = null,
  footerClassName = '',
  footerStyle,
  footerAdjustableHeight = false,
  header = null,
  onScroll,
  refreshControl
}: JBMainLayoutProps) => {
  const baseConfig = getLastCreatedJBExpoConfig();
  const mode = useColorScheme();
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
  const contentContainerClassName = 'flex-1 rounded-tl-3xl rounded-tr-3xl';
  const rootClassName = `flex-1 ${backgroundHeaderClassName} pt-2 ${className ?? ''}`;
  const scrollClassName = `pt-0 ${contentContainerClassName} ${backgroundClassName} ${classNameScrollView ?? ''}`;

  if (scrollable) {
    return (
      <Box className={rootClassName} style={{ backgroundColor: rootBackgroundColor }}>
        <Box className="flex-1">
          {header}
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
              className={`${footerAdjustableHeight ? 'py-4' : 'min-h-[96px]'} px-8 bg-light dark:bg-background-950 justify-center rounded-tl-3xl rounded-tr-3xl ${footerClassName}`}
              style={[{ backgroundColor: footerBackgroundColor }, footerStyle]}
            >
              {footer}
            </Box>
          ) : null}
        </Box>
      </Box>
    );
  }

  return (
    <Box className={rootClassName} style={{ backgroundColor: rootBackgroundColor }}>
      <Box className="flex-1">
        {header}
        <Box
          className={`pt-0 ${contentContainerClassName} ${backgroundClassName}`}
          style={{ backgroundColor: contentBackgroundColor }}
        >
          {children}
        </Box>
        {footer ? (
          <Box
            className={`${footerAdjustableHeight ? 'py-4' : 'min-h-[96px]'} px-8 bg-light dark:bg-background-950 justify-center ${footerClassName}`}
            style={[{ backgroundColor: footerBackgroundColor }, footerStyle]}
          >
            {footer}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
