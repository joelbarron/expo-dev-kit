import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { JBUIHeaderBackIconConfig } from '../../config';

export type JBStackHeaderProps = {
  title?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  centerTitle?: boolean;
  backgroundColor: string;
  tintColor: string;
  minContentHeight?: number;
  paddingHorizontal?: number;
  backIcon?: JBUIHeaderBackIconConfig;
};

const DEFAULT_BACK_ICON: Required<
  Exclude<JBUIHeaderBackIconConfig, string>
> = {
  ios: 'arrow-back-ios-new',
  android: 'arrow-back',
  default: 'arrow-back',
};

const resolveBackIconName = (
  iconConfig: JBUIHeaderBackIconConfig | undefined,
): string => {
  if (typeof iconConfig === 'string' && iconConfig.trim().length > 0) {
    return iconConfig.trim();
  }

  const byPlatform =
    (iconConfig as Exclude<JBUIHeaderBackIconConfig, string> | undefined) ??
    DEFAULT_BACK_ICON;
  const platformValue =
    Platform.OS === 'ios' ? byPlatform.ios : byPlatform.android;
  if (platformValue?.trim()) {
    return platformValue.trim();
  }

  if (byPlatform.default?.trim()) {
    return byPlatform.default.trim();
  }

  const fallback = Platform.OS === 'ios' ? DEFAULT_BACK_ICON.ios : DEFAULT_BACK_ICON.android;
  return fallback;
};

export const JBStackHeader = ({
  title,
  canGoBack = false,
  onBack,
  leftSlot = null,
  rightSlot = null,
  centerTitle = true,
  backgroundColor,
  tintColor,
  minContentHeight = 52,
  paddingHorizontal = 16,
  backIcon,
}: JBStackHeaderProps) => {
  const insets = useSafeAreaInsets();
  const iconName = resolveBackIconName(backIcon);
  const hasLeftSlot = leftSlot !== null && leftSlot !== undefined;
  const hasRightSlot = rightSlot !== null && rightSlot !== undefined;
  const renderBackButton =
    canGoBack && typeof onBack === 'function' && !hasLeftSlot;

  const leftContent = hasLeftSlot ? (
    leftSlot
  ) : renderBackButton ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Regresar"
      onPress={onBack}
      hitSlop={8}
      style={styles.iconButton}
    >
      <MaterialIcons name={iconName as any} size={24} color={tintColor} />
    </Pressable>
  ) : (
    <View style={styles.emptySlot} />
  );

  const rightContent = hasRightSlot ? rightSlot : <View style={styles.emptySlot} />;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: Math.max(insets.top, 0),
        },
      ]}
    >
      <View
        style={[
          styles.content,
          {
            minHeight: Math.max(minContentHeight, 44),
            paddingHorizontal: Math.max(paddingHorizontal, 0),
          },
        ]}
      >
        <View style={styles.side}>{leftContent}</View>
        <View
          style={[
            styles.titleContainer,
            centerTitle ? styles.titleCentered : styles.titleStart,
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: tintColor,
                textAlign: centerTitle ? 'center' : 'left',
              },
            ]}
          >
            {title ?? ''}
          </Text>
        </View>
        <View style={[styles.side, styles.sideRight]}>{rightContent}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  side: {
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  emptySlot: {
    width: 44,
    height: 44,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  titleCentered: {
    alignItems: 'center',
  },
  titleStart: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
});
