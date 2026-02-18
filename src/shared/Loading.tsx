// @ts-nocheck
import React from 'react';

import { getColor } from '../utils/colors';
import { Box } from '../ui/box';
import { HStack } from '../ui/hstack';
import { CustomLoader } from './CustomLoader';

export const Loading = () => {
  const primaryColor = getColor('primary');

  return (
    <Box className="w-full h-full min-h-[100px] flex-1 justify-center items-center ">
      <HStack space="sm">
        <CustomLoader size={48} color={primaryColor[500]} />
      </HStack>
    </Box>
  );
};
