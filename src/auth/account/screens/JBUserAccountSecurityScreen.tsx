
import { useMemo } from 'react';

import { getAuthRoutesConfig, getLastCreatedJBExpoConfig } from '../../../config';
import { useAppConfigStore } from '../../../runtime';
import { Box } from '../../../ui';
import { AuthScreenLayout } from '../../ui';
import { JBUserAccountActions } from '../components';

export type JBUserAccountSecurityScreenProps = {
  basePath?: string;
};

export function JBUserAccountSecurityScreen(props: JBUserAccountSecurityScreenProps) {
  const { basePath } = props;
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const authRoutes = useMemo(
    () =>
      getAuthRoutesConfig({
        ...baseConfig,
        auth: {
          ...baseConfig.auth,
          ...(appConfig?.auth ?? {}),
        },
      } as any),
    [appConfig?.auth, baseConfig]
  );
  const resolvedBasePath = String(basePath ?? '').trim() || authRoutes.userBasePath;

  return (
    <AuthScreenLayout
      title=""
      subtitle="Desde aquí puedes administrar tu información personal y los accesos de tu cuenta."
    >
      <Box className="w-full">
        <JBUserAccountActions
          basePath={resolvedBasePath}
          title="Accesos rápidos"
        />
      </Box>
    </AuthScreenLayout>
  );
}
