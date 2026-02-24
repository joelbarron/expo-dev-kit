import { BaseToast } from 'react-native-toast-message';

import { getColor } from '../../utils/colors';

const DURATION = 2000;

const primaryColor = getColor('primary') ?? {};
const greenColor = getColor('green') ?? {};
const redColor = getColor('red') ?? {};

const createSolidToast = (backgroundColor: string, marginTop = 48) => (props: any) => (
  <BaseToast
    {...props}
    style={{
      marginTop,
      borderLeftWidth: 0,
      backgroundColor,
      borderRadius: 12,
      minHeight: 72,
      width: '94%'
    }}
    contentContainerStyle={{
      paddingHorizontal: 16,
      paddingVertical: 10
    }}
    text1Style={{
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff'
    }}
    text2Style={{
      fontSize: 16,
      lineHeight: 20,
      color: '#ffffff'
    }}
    visibilityTime={DURATION}
  />
);

export const toastConfig = {
  success: createSolidToast(greenColor[600] ?? '#16a34a', 52),
  error: createSolidToast(redColor[600] ?? '#dc2626', 52),
  info: createSolidToast(primaryColor[600] ?? '#0ea5e9', 52)
};
