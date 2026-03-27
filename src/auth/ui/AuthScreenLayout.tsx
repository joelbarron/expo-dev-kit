import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';

import { getLastCreatedJBExpoConfig, resolveJBUIColor } from '../../config';
import { JBMainLayout } from '../../core';
import { useColorScheme } from '../../hooks';
import { getColor } from '../../utils/colors';

export type AuthScreenLayoutProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  footerClassName?: string;
  footerStyle?: StyleProp<ViewStyle>;
  footerAdjustableHeight?: boolean;
  useMainLayout?: boolean;
  contentAlign?: 'top' | 'center';
};

export const AuthScreenLayout = ({
  title,
  subtitle,
  children,
  header,
  footer,
  footerClassName,
  footerStyle,
  footerAdjustableHeight = false,
  useMainLayout = true,
  contentAlign = 'top'
}: AuthScreenLayoutProps) => {
  const scheme = useColorScheme();
  const background = getColor('background') ?? {};
  const typography = getColor('typography') ?? {};
  const isDark = scheme === 'dark';
  const baseConfig = getLastCreatedJBExpoConfig();
  const uiConfig = baseConfig?.ui;
  const mainBackgroundColor = resolveJBUIColor(
    uiConfig?.main?.backgroundColor,
    scheme,
    isDark ? background[0] ?? '#070b10' : background.light ?? '#fbfbfb'
  );
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const titleColor = isDark
    ? typography.white ?? typography[50] ?? '#f8fafc'
    : typography.black ?? typography[900] ?? '#0f172a';
  const subtitleColor = isDark
    ? typography[300] ?? '#cbd5e1'
    : typography[500] ?? '#64748b';

  const content = (
    <View
      style={[
        styles.contentContainer,
        isTablet ? styles.contentContainerTablet : null
      ]}
    >
      {title || subtitle ? (
        <View style={styles.header}>
          {title ? <Text style={[styles.title, { color: titleColor }]}>{title}</Text> : null}
          {subtitle ? <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text> : null}
        </View>
      ) : null}

      <View
        style={[
          styles.body,
          contentAlign === 'center' ? styles.bodyCentered : null
        ]}
      >
        {children}
      </View>

      {!useMainLayout && footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );

  if (useMainLayout) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <JBMainLayout
          className="flex-1"
          header={header}
          footer={footer}
          footerClassName={footerClassName}
          footerStyle={footerStyle}
          footerAdjustableHeight={footerAdjustableHeight}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        </JBMainLayout>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.root,
        { backgroundColor: mainBackgroundColor }
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24
  },
  contentContainer: {
    width: '100%',
    flexGrow: 1
  },
  contentContainerTablet: {
    maxWidth: 560,
    alignSelf: 'center'
  },
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827'
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#4b5563'
  },
  body: {
    gap: 12
  },
  bodyCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  footer: {
    marginTop: 24
  }
});
