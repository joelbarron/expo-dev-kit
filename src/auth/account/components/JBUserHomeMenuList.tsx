import React from 'react';

import { VStack } from '../../../ui';
import { JBUserHomeMenuItem } from '../types';
import { JBUserHomeMenuItemRow } from './JBUserHomeMenuItemRow';

type JBUserHomeMenuListProps = {
  items: JBUserHomeMenuItem[];
  onPressItem: (item: JBUserHomeMenuItem) => void;
};

export const JBUserHomeMenuList = ({ items, onPressItem }: JBUserHomeMenuListProps) => {
  return (
    <VStack space="md">
      {items.map((item) => (
        <JBUserHomeMenuItemRow key={item.id} item={item} onPress={onPressItem} />
      ))}
    </VStack>
  );
};
