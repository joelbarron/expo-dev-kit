import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { JBFormButton, JBFormInput, JBFormPicker } from '../../../forms';
import { Box, Text, VStack } from '../../../ui';
import { parseAuthError } from '../../forms/errorParser';
import { useJBAuth } from '../../provider';
import { AuthScreenLayout } from '../../ui';

const CHANNEL_OPTIONS: Array<{ label: string; value: 'email' | 'sms' }> = [
  { label: 'Correo electronico', value: 'email' },
  { label: 'Telefono (SMS)', value: 'sms' },
];

type FormValues = {
  channel: { label: string; value: 'email' | 'sms' } | 'email' | 'sms';
  email: string;
  phone: string;
  code: string;
};

const getChannelValue = (channel: FormValues['channel']): 'email' | 'sms' => {
  if (typeof channel === 'string') {
    return channel;
  }
  return channel?.value === 'sms' ? 'sms' : 'email';
};

export function JBUserAccountContactScreen() {
  const auth = useJBAuth();
  const user = (auth.user ?? {}) as Record<string, any>;
  const defaultEmail = typeof user.email === 'string' ? user.email : '';
  const defaultPhone = typeof user.phone === 'string' ? user.phone : '';

  const { control, watch, setValue, getValues } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      channel: CHANNEL_OPTIONS[0],
      email: defaultEmail,
      phone: defaultPhone,
      code: '',
    },
  });

  const channel = watch('channel');
  const channelValue = getChannelValue(channel);
  const contactLabel = channelValue === 'email' ? 'Correo' : 'Telefono';
  const contactField = channelValue === 'email' ? 'email' : 'phone';
  const contactValue = watch(contactField);
  const codeValue = watch('code');

  const submitPayload = useMemo(() => {
    const values = getValues();
    return {
      channel: channelValue,
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      code: values.code?.trim() || undefined,
    };
  }, [channelValue, getValues, contactValue, codeValue]);

  const handleCheckAvailability = async () => {
    const value = contactValue?.trim?.() ?? '';
    if (!value) {
      Toast.show({ type: 'info', text1: `${contactLabel} requerido` });
      return;
    }

    try {
      const response =
        channelValue === 'email'
          ? await auth.checkEmailAvailability({ email: value })
          : await auth.checkPhoneAvailability({ phone: value });
      if (response.available) {
        Toast.show({
          type: 'success',
          text1: `${contactLabel} disponible`,
          text2: 'Puedes usar este dato en tu cuenta.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: `${contactLabel} no disponible`,
          text2: response.detail || 'El valor ya esta en uso.',
        });
      }
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: `No se pudo validar ${contactLabel.toLowerCase()}`,
        text2: parsed.rootMessage || 'Intenta de nuevo.',
      });
    }
  };

  const handleRequestCode = async () => {
    const value = contactValue?.trim?.() ?? '';
    if (!value) {
      Toast.show({ type: 'info', text1: `${contactLabel} requerido` });
      return;
    }

    try {
      await auth.requestContactVerification({
        channel: channelValue,
        email: submitPayload.email,
        phone: submitPayload.phone,
      });
      Toast.show({
        type: 'success',
        text1: 'Codigo enviado',
        text2: 'Revisa el medio de contacto seleccionado.',
      });
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'No se pudo enviar el codigo',
        text2: parsed.rootMessage || 'Intenta de nuevo.',
      });
    }
  };

  const handleVerifyCode = async () => {
    const code = submitPayload.code ?? '';
    if (!code) {
      Toast.show({ type: 'info', text1: 'Debes ingresar el codigo' });
      return;
    }

    try {
      await auth.verifyContactVerification({
        channel: channelValue,
        code,
        email: submitPayload.email,
        phone: submitPayload.phone,
      });
      await auth.getMe().catch(() => undefined);
      setValue('code', '');
      Toast.show({
        type: 'success',
        text1: 'Contacto verificado',
        text2: 'Tu cuenta se actualizo correctamente.',
      });
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'Codigo invalido',
        text2: parsed.rootMessage || 'Verifica el codigo e intenta de nuevo.',
      });
    }
  };

  return (
    <AuthScreenLayout
      title="Contacto y verificacion"
      subtitle="Valida tus datos de contacto para reforzar la seguridad de la cuenta."
    >
      <Box className="w-full">
        <VStack space="lg">
          <JBFormPicker
            control={control}
            fieldName="channel"
            label="Canal"
            items={CHANNEL_OPTIONS}
          />
          <JBFormInput
            control={control}
            fieldName={contactField as any}
            label={contactLabel}
            keyboardType={channelValue === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
          />

          <JBFormButton
            variant="outline"
            action="primary"
            text={`Validar ${contactLabel.toLowerCase()}`}
            onPress={() => void handleCheckAvailability()}
          />
          <JBFormButton
            variant="solid"
            action="secondary"
            text="Enviar codigo"
            onPress={() => void handleRequestCode()}
          />

          <JBFormInput
            control={control}
            fieldName="code"
            label="Codigo"
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          <JBFormButton
            buttonType="save"
            text="Verificar codigo"
            onPress={() => void handleVerifyCode()}
          />

          <Text size="xs" className="text-typography-300">
            Este flujo usa los endpoints de disponibilidad y verificacion de contacto del backend de autenticacion.
          </Text>
        </VStack>
      </Box>
    </AuthScreenLayout>
  );
}
