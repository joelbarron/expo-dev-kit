import * as Linking from 'expo-linking';

import { JBFormButton } from '../../forms';
import { Box } from '../../ui/box';
import { Heading } from '../../ui/heading';
import { Text } from '../../ui/text';
import { useJBAppMeta } from '../layout/appMeta';

export type JBRequireUpdateScreenProps = {
  appName?: string;
  title?: string;
  line1?: string;
  line2?: string;
  updateUrl?: string;
  buttonLabel?: string;
};

export const JBRequireUpdateScreen = ({
  appName,
  title = 'Actualización requerida',
  line1 = 'Hay una nueva versión disponible.',
  line2 = 'Actualiza la aplicación para continuar.',
  updateUrl,
  buttonLabel = 'Actualizar aplicación',
}: JBRequireUpdateScreenProps) => {
  const appMeta = useJBAppMeta();

  return (
    <Box className="flex-1 items-center justify-center bg-primary-500 px-6">
      <Heading size="5xl" bold className="text-center text-white">
        {appName ?? appMeta.name}
      </Heading>
      <Text size="xl" className="mt-4 text-center font-semibold text-white">
        {title}
      </Text>
      <Text size="lg" className="mt-2 text-center text-white/95">
        {line1}
      </Text>
      <Text size="lg" className="text-center text-white/95">
        {line2}
      </Text>
      <Box className="mt-7 w-full max-w-[320px]">
        <JBFormButton
          text={buttonLabel}
          action="primary"
          variant="solid"
          onPress={() => {
            if (!updateUrl) return;
            void Linking.openURL(updateUrl).catch(() => undefined);
          }}
          isDisabled={!updateUrl}
        />
      </Box>
    </Box>
  );
};
