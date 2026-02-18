// @ts-nocheck
import React from 'react';

import { Box } from '../ui/box';
import { Heading } from '../ui/heading';
import { Text } from '../ui/text';

export const BigMessage = ({
  text1,
  text2
}: {
  text1?: string;
  text2?: string;
}) => {
  return (
    <Box className="flex-1 justify-center items-center">
      <Heading size="2xl" className="text-zinc-800">
        {text1}
      </Heading>
      <Text size="xl" className="text-zinc-500">
        {text2}
      </Text>
    </Box>
  );
};
