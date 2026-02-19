import { ReactElement, ReactNode } from 'react';
import { ScrollView, StyleProp, ViewStyle } from 'react-native';
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
  const backgroundClassName = 'bg-background-light dark:bg-background-0';
  const backgroundHeaderClassName = 'bg-primary-500 dark:bg-background-950';
  const contentContainerClassName = 'flex-1 rounded-tl-3xl rounded-tr-3xl';
  const rootClassName = `flex-1 ${backgroundHeaderClassName} pt-2 ${className ?? ''}`;
  const scrollClassName = `pt-0 ${contentContainerClassName} ${backgroundClassName} ${classNameScrollView ?? ''}`;

  if (scrollable) {
    return (
      <Box className={rootClassName}>
        <Box className="flex-1">
          {header}
          <ScrollView
            {...({ className: scrollClassName } as any)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={contentContainerStyle}
            onScroll={onScroll as ((event: any) => void) | undefined}
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
          {footer ? (
            <Box
              className={`${footerAdjustableHeight ? 'py-4' : 'min-h-[96px]'} px-8 bg-light dark:bg-background-950 justify-center rounded-tl-3xl rounded-tr-3xl ${footerClassName}`}
              style={footerStyle}
            >
              {footer}
            </Box>
          ) : null}
        </Box>
      </Box>
    );
  }

  return (
    <Box className={rootClassName}>
      <Box className="flex-1">
        {header}
        <Box className={`pt-0 ${contentContainerClassName} ${backgroundClassName}`}>
          {children}
        </Box>
        {footer ? (
          <Box
            className={`${footerAdjustableHeight ? 'py-4' : 'min-h-[96px]'} px-8 bg-light dark:bg-background-950 justify-center ${footerClassName}`}
            style={footerStyle}
          >
            {footer}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
