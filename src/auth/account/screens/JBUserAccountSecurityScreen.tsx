import React from 'react';

import { Box } from '../../../ui';
import { AuthScreenLayout } from '../../ui';
import { JBUserAccountActions } from '../components';

export type JBUserAccountSecurityScreenProps = {
  basePath?: string;
};

export function JBUserAccountSecurityScreen(props: JBUserAccountSecurityScreenProps) {
  const { basePath = '/user' } = props;

  return (
    <AuthScreenLayout>
      <Box className="w-full">
        <JBUserAccountActions basePath={basePath} />
      </Box>
    </AuthScreenLayout>
  );
}
