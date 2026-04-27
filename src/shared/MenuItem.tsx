// @ts-nocheck
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Box } from '../ui/box';
import { Text } from '../ui/text';
import { VStack } from '../ui/vstack';

type MenuItemType = 'rounded' | 'square';

type MenuItemProps = {
  title: string;
  iconName?: any;
  iconType?: 'FontAwesome' | 'MaterialIcons';
  iconSize?: number;
  path: string;
  className?: string;
  type?: MenuItemType;
  /**
   * Renders the item with reduced opacity and a small lock badge over the icon.
   * Navigation still happens on press — apps decide what to do (e.g. show an
   * upgrade modal). For full block, also wire your own onPress handler.
   */
  locked?: boolean;
};

export const MenuItem = ({
  title,
  iconName,
  iconType = 'FontAwesome',
  iconSize = 25,
  path,
  className,
  type = 'rounded',
  locked = false,
}: MenuItemProps) => {
  const shapeClassName = type === 'square' ? 'rounded-xl' : 'rounded-full';
  const lockedOpacity = locked ? 'opacity-60' : '';

  return (
    <Link href={path} asChild>
      <TouchableOpacity>
        <VStack className={`items-center ${lockedOpacity} ${className ?? ''}`}>
          <Box className="relative">
            <Box
              className={`w-20 h-20 flex-row justify-center items-center bg-background-0 ${shapeClassName}`}
            >
              {iconType === 'MaterialIcons' ? (
                <MaterialIcons name={iconName} color="white" size={iconSize} />
              ) : (
                <FontAwesome name={iconName} color="white" size={iconSize} />
              )}
            </Box>
            {locked ? (
              <Box className="absolute -right-1 -top-1 h-7 w-7 items-center justify-center rounded-full bg-background-950 border border-white/20">
                <FontAwesome name="lock" size={12} color="white" />
              </Box>
            ) : null}
          </Box>
          <Text className="font-semibold mt-2" size="sm">
            {title}
          </Text>
        </VStack>
      </TouchableOpacity>
    </Link>
  );
};

export const RoundedMenuItem = (props: Omit<MenuItemProps, 'type'> & { type?: MenuItemType }) => (
  <MenuItem {...props} type={props.type ?? 'rounded'} />
);
