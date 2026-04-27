import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { useColorScheme } from '../../../hooks';
import { HStack, Text, VStack } from '../../../ui';
import { getColor } from '../../../utils';
import { JBUserHomeMenuItem } from '../types';

type JBUserHomeMenuItemRowProps = {
  item: JBUserHomeMenuItem;
  onPress: (item: JBUserHomeMenuItem) => void;
};

export const JBUserHomeMenuItemRow = ({ item, onPress }: JBUserHomeMenuItemRowProps) => {
  const colorScheme = useColorScheme();
  const primaryColor = getColor('primary');
  const mutedColor = getColor('muted');
  const iconColor =
    colorScheme === 'dark'
      ? primaryColor?.[400] ?? primaryColor?.[500] ?? '#0ea5e9'
      : primaryColor?.[600] ?? primaryColor?.[500] ?? '#0284c7';
  const chevronColor =
    typeof mutedColor === 'string' ? mutedColor : '#8A8A93';
  const optionIconName = item.iconName ?? 'chevron-right';

  return (
    <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.9}>
      <HStack className="w-full items-center justify-between rounded-2xl bg-background-150 px-4 py-4 dark:bg-background-200">
        <HStack space="sm" className="flex-1 items-center pr-3">
          <MaterialIcons name={optionIconName} size={22} color={iconColor} className="mr-3" />
          <VStack className="flex-1">
            <Text bold size="md" className="text-typography-900">
              {item.title}
            </Text>
            <Text size="sm" className="text-typography-500">
              {item.subtitle}
            </Text>
          </VStack>
        </HStack>
        <MaterialIcons name="chevron-right" size={22} color={chevronColor} />
      </HStack>
    </TouchableOpacity>
  );
};
