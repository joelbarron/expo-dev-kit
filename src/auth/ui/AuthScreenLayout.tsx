import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useColorScheme } from '../../hooks';
import { getColor } from '../../utils/colors';

export type AuthScreenLayoutProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export const AuthScreenLayout = ({ title, subtitle, children, footer }: AuthScreenLayoutProps) => {
  const scheme = useColorScheme();
  const background = getColor('background') ?? {};
  const isDark = scheme === 'dark';
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <KeyboardAvoidingView
      style={[
        styles.root,
        { backgroundColor: isDark ? background[0] ?? '#070b10' : background.light ?? '#fbfbfb' }
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View
          style={[
            styles.contentContainer,
            isTablet ? styles.contentContainerTablet : null
          ]}
        >
          {title || subtitle ? (
            <View style={styles.header}>
              {title ? <Text style={[styles.title, { color: isDark ? '#ffffff' : '#27272a' }]}>{title}</Text> : null}
              {subtitle ? <Text style={[styles.subtitle, { color: '#9ca3af' }]}>{subtitle}</Text> : null}
            </View>
          ) : null}

          <View style={styles.body}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
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
    width: '100%'
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
  footer: {
    marginTop: 24
  }
});
