import { Box } from '../../ui/box';
import { Heading } from '../../ui/heading';
import { Text } from '../../ui/text';
import { useJBAppMeta } from '../layout/appMeta';

export type JBUnderMaintenanceScreenProps = {
  appName?: string;
  title?: string;
  line1?: string;
  line2?: string;
};

export const JBUnderMaintenanceScreen = ({
  appName,
  title,
  line1,
  line2
}: JBUnderMaintenanceScreenProps) => {
  const appMeta = useJBAppMeta();

  return (
    <Box className="flex-1 items-center justify-center bg-primary-500 px-6">
      <Heading size="5xl" bold className="text-white text-center">
        {appName ?? appMeta.name}
      </Heading>
      <Text size="xl" className="text-white text-center mt-4 font-semibold">
        {title ?? appMeta.maintenanceTitle}
      </Text>
      <Text size="xl" className="text-white text-center font-semibold">
        {line1 ?? appMeta.maintenanceLine1}
      </Text>
      <Text size="xl" className="text-white text-center font-semibold">
        {line2 ?? appMeta.maintenanceLine2}
      </Text>
    </Box>
  );
};
