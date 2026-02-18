import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';

import { getColor } from '../../utils/colors';

const DURATION = 2000;

const primaryColor = getColor('primary') ?? {};
const redColor = getColor('red') ?? {};

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: primaryColor[600] ?? '#059669',
        marginTop: 40
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 5
      }}
      text1Style={{
        fontSize: 17,
        fontWeight: '400'
      }}
      text2Style={{
        fontSize: 15
      }}
      visibilityTime={DURATION}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ marginTop: 80, borderLeftColor: redColor[500] ?? '#ef4444' }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 5
      }}
      text1Style={{
        fontSize: 17,
        fontWeight: '400'
      }}
      text2Style={{
        fontSize: 15
      }}
      visibilityTime={DURATION}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={{ marginTop: 80, borderLeftColor: primaryColor[950] ?? '#022c22' }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 5
      }}
      text1Style={{
        fontSize: 17,
        fontWeight: '400'
      }}
      text2Style={{
        fontSize: 15
      }}
      visibilityTime={DURATION}
    />
  )
};
