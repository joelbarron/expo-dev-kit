
import { Box } from '../../../ui';
import { AuthScreenLayout } from '../../ui';
import { JBUserAccountActions } from '../components';

export type JBUserAccountSecurityScreenProps = {
  basePath?: string;
};

export function JBUserAccountSecurityScreen(props: JBUserAccountSecurityScreenProps) {
  const { basePath = '/user' } = props;

  return (
    <AuthScreenLayout
      title=""
      subtitle="Desde aquí puedes administrar tu información personal y los accesos de tu cuenta."
    >
      <Box className="w-full">
        <JBUserAccountActions
          basePath={basePath}
          title="Accesos rápidos"
        />
      </Box>
    </AuthScreenLayout>
  );
}
