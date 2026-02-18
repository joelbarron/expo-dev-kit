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
};

export const MenuItem = ({
  title,
  iconName,
  iconType = 'FontAwesome',
  iconSize = 25,
  path,
  className,
  type = 'rounded'
}: MenuItemProps) => {
  const shapeClassName = type === 'square' ? 'rounded-xl' : 'rounded-full';

  return (
    <Link href={path} asChild>
      <TouchableOpacity>
        <VStack className={`items-center ${className ?? ''}`}>
          <Box
            className={`w-20 h-20 flex-row justify-center items-center bg-background-0 ${shapeClassName}`}
          >
            {iconType === 'MaterialIcons' ? (
              <MaterialIcons name={iconName} color="white" size={iconSize} />
            ) : (
              <FontAwesome name={iconName} color="white" size={iconSize} />
            )}
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
