import { JBFormButton } from '../../forms';
import { Box } from '../../ui/box';
import { Heading } from '../../ui/heading';
import { Text } from '../../ui/text';

type JBOfflineGateScreenProps = {
  mode: 'blocking_with_offline' | 'strict_blocking' | 'banner_only';
  onRetry?: () => void;
  onContinueOffline?: () => void;
};

export const JBOfflineGateScreen = ({
  mode,
  onRetry,
  onContinueOffline,
}: JBOfflineGateScreenProps) => {
  const canContinueOffline = mode === 'blocking_with_offline';

  return (
    <Box className="flex-1 items-center justify-center bg-primary-500 px-6">
      <Heading size="4xl" bold className="text-center text-white">
        Sin conexión
      </Heading>
      <Text size="lg" className="mt-3 text-center text-white">
        No detectamos conexión a internet.
      </Text>
      <Text size="md" className="mt-1 text-center text-white/90">
        {canContinueOffline
          ? 'Puedes continuar en modo lectura y reintentar después.'
          : 'Conéctate para continuar usando la aplicación.'}
      </Text>

      <Box className="mt-8 w-full max-w-[360px]">
        <JBFormButton
          text="Reintentar"
          action="primary"
          variant="solid"
          onPress={onRetry}
        />
        {canContinueOffline ? (
          <JBFormButton
            text="Continuar offline"
            action="secondary"
            variant="outline"
            className="mt-3"
            onPress={onContinueOffline}
          />
        ) : null}
      </Box>
    </Box>
  );
};
