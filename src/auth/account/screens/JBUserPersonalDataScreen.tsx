import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { JBFormButton, JBFormInput, JBFormPicker } from '../../../forms';
import { ConfirmationDialog } from '../../../shared';
import { Box, HStack, Text, VStack } from '../../../ui';
import { CheckCircleIcon, Icon } from '../../../ui/icon';
import { InputSlot } from '../../../ui/input';
import { COUNTRY_CALLING_CODE_OPTIONS, DEFAULT_OTP_COUNTRY_CODE } from '../../constants';
import { parseAuthError } from '../../forms/errorParser';
import { useJBAuth } from '../../provider';
import { AuthScreenLayout } from '../../ui';
import { buildE164Phone, isValidE164Phone, resolveCountryCodeValue } from '../../utils';
import { useJBUserAccountCapabilities } from '../hooks';

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

type AvailabilityFieldState = {
  status: AvailabilityStatus;
  detail?: string;
};

type AvailabilityState = {
  email: AvailabilityFieldState;
  username: AvailabilityFieldState;
  phone: AvailabilityFieldState;
};

type FormValues = {
  email: string;
  username: string;
  phoneCountryCode: { label: string; value: string } | string | null;
  phoneNumber: string;
  emailOtpCode: string;
  phoneOtpCode: string;
};

type SnapshotState = {
  email: string;
  username: string;
  phone: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formSchema: z.ZodType<FormValues> = z.object({
  email: z.string(),
  username: z.string(),
  phoneCountryCode: z.any(),
  phoneNumber: z.string(),
  emailOtpCode: z.string(),
  phoneOtpCode: z.string(),
});

const idleAvailabilityState: AvailabilityState = {
  email: { status: 'idle' },
  username: { status: 'idle' },
  phone: { status: 'idle' },
};

const pickString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeDigits = (value: string): string => value.replace(/\D+/g, '');

const countryOptionsByDialLength = [...COUNTRY_CALLING_CODE_OPTIONS].sort(
  (left, right) => right.value.length - left.value.length
);

const resolveCountryOption = (dialCode: string | null | undefined) => {
  const code = pickString(dialCode);
  if (!code) {
    return COUNTRY_CALLING_CODE_OPTIONS.find(
      (option) => option.value === DEFAULT_OTP_COUNTRY_CODE
    );
  }
  return (
    COUNTRY_CALLING_CODE_OPTIONS.find((option) => option.value === code) ??
    COUNTRY_CALLING_CODE_OPTIONS.find((option) => option.value === DEFAULT_OTP_COUNTRY_CODE)
  );
};

const splitPhoneFromE164 = (
  phone: string | null | undefined
): { countryCode: string; phoneNumber: string } => {
  const raw = pickString(phone);
  if (!raw) {
    return { countryCode: DEFAULT_OTP_COUNTRY_CODE, phoneNumber: '' };
  }

  const normalized = raw.startsWith('+') ? raw : `+${normalizeDigits(raw)}`;
  const matched = countryOptionsByDialLength.find((option) =>
    normalized.startsWith(option.value)
  );

  if (matched) {
    return {
      countryCode: matched.value,
      phoneNumber: normalizeDigits(normalized.slice(matched.value.length)),
    };
  }

  return {
    countryCode: DEFAULT_OTP_COUNTRY_CODE,
    phoneNumber: normalizeDigits(normalized),
  };
};

const mapAvailabilityError = (error: unknown, fallback: string): string => {
  const parsed = parseAuthError(error);
  return parsed.rootMessage || fallback;
};

type PersonalDataSection = 'email' | 'phone' | 'username';
const OTP_RESEND_COOLDOWN_SECONDS = 30;

export function JBUserPersonalDataScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const auth = useJBAuth();
  const capabilities = useJBUserAccountCapabilities();

  const canEdit = capabilities.canEditPersonalData;
  const contactVerificationEnabled = capabilities.accountConfig.enableContactVerification;

  const [availability, setAvailability] = useState<AvailabilityState>(
    idleAvailabilityState
  );
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState<
    string | null
  >(null);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState<
    string | null
  >(null);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const [openSection, setOpenSection] = useState<PersonalDataSection | null>(null);
  const [otpPrioritySection, setOtpPrioritySection] = useState<PersonalDataSection | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const allowExitRef = useRef(false);
  const pendingActionRef = useRef<any>(null);

  const user = (auth.user ?? {}) as Record<string, unknown>;

  const initialState = useMemo(() => {
    const email = pickString(user.email);
    const username = pickString(user.username);

    const explicitPhoneCountryCode =
      pickString((user as any).phoneCountryCode) ||
      pickString((user as any).phone_country_code);
    const explicitPhoneNumber =
      pickString((user as any).phoneNumber) || pickString((user as any).phone_number);

    const fromPhone = splitPhoneFromE164(
      explicitPhoneNumber
        ? `${explicitPhoneCountryCode || DEFAULT_OTP_COUNTRY_CODE}${explicitPhoneNumber}`
        : pickString((user as any).phone)
    );

    const countryCode = explicitPhoneCountryCode || fromPhone.countryCode;
    const phoneNumber = explicitPhoneNumber
      ? normalizeDigits(explicitPhoneNumber)
      : fromPhone.phoneNumber;

    const countryOption = resolveCountryOption(countryCode);

    return {
      email,
      username,
      phoneCountryCode: countryOption ?? { label: countryCode, value: countryCode },
      phoneNumber,
    };
  }, [user]);

  const {
    control,
    formState,
    reset,
    setValue,
    trigger,
    handleSubmit,
  } = useForm<FormValues>({
    mode: 'onBlur',
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      email: initialState.email,
      username: initialState.username,
      phoneCountryCode: initialState.phoneCountryCode,
      phoneNumber: initialState.phoneNumber,
      emailOtpCode: '',
      phoneOtpCode: '',
    },
  });

  const emailValue = useWatch({ control, name: 'email' }) ?? '';
  const usernameValue = useWatch({ control, name: 'username' }) ?? '';
  const phoneCountryCodeValue =
    useWatch({ control, name: 'phoneCountryCode' }) ?? initialState.phoneCountryCode;
  const phoneNumberValue = useWatch({ control, name: 'phoneNumber' }) ?? '';
  const emailOtpCodeValue = useWatch({ control, name: 'emailOtpCode' }) ?? '';
  const phoneOtpCodeValue = useWatch({ control, name: 'phoneOtpCode' }) ?? '';

  const previousEmailRef = useRef(emailValue);

  const currentPhoneCountryCode = resolveCountryCodeValue(phoneCountryCodeValue);
  const fullPhone = useMemo(() => {
    const digits = normalizeDigits(phoneNumberValue);
    if (!digits) return '';
    return buildE164Phone(currentPhoneCountryCode, digits);
  }, [currentPhoneCountryCode, phoneNumberValue]);
  const previousPhoneRef = useRef(fullPhone);

  const initialSnapshot = useMemo<SnapshotState>(() => {
    const phone = initialState.phoneNumber
      ? buildE164Phone(initialState.phoneCountryCode, initialState.phoneNumber)
      : '';
    return {
      email: initialState.email,
      username: initialState.username,
      phone,
    };
  }, [initialState]);

  const emailChanged = emailValue.trim() !== initialSnapshot.email;
  const usernameChanged = usernameValue.trim() !== initialSnapshot.username;
  const phoneChanged = fullPhone !== initialSnapshot.phone;
  const hasChanges = emailChanged || usernameChanged || phoneChanged;
  const isEmailOtpLocked =
    contactVerificationEnabled && emailChanged && (emailOtpSent || Boolean(emailVerificationToken));
  const isPhoneOtpLocked =
    contactVerificationEnabled && phoneChanged && (phoneOtpSent || Boolean(phoneVerificationToken));

  useEffect(() => {
    reset({
      email: initialState.email,
      username: initialState.username,
      phoneCountryCode: initialState.phoneCountryCode,
      phoneNumber: initialState.phoneNumber,
      emailOtpCode: '',
      phoneOtpCode: '',
    });
    setAvailability(idleAvailabilityState);
    setEmailOtpSent(false);
    setPhoneOtpSent(false);
    setEmailVerificationToken(null);
    setPhoneVerificationToken(null);
    setEmailResendCooldown(0);
    setPhoneResendCooldown(0);
    setOpenSection(null);
    setOtpPrioritySection(null);
    setShowDiscardDialog(false);
    allowExitRef.current = false;
    pendingActionRef.current = null;
  }, [initialState, reset]);

  useEffect(() => {
    if (previousEmailRef.current === emailValue) return;
    previousEmailRef.current = emailValue;
    setEmailOtpSent(false);
    setEmailVerificationToken(null);
    setEmailResendCooldown(0);
    setValue('emailOtpCode', '');
  }, [emailValue, setValue]);

  useEffect(() => {
    if (previousPhoneRef.current === fullPhone) return;
    previousPhoneRef.current = fullPhone;
    setPhoneOtpSent(false);
    setPhoneVerificationToken(null);
    setPhoneResendCooldown(0);
    setValue('phoneOtpCode', '');
  }, [fullPhone, setValue]);

  useEffect(() => {
    if (emailResendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setEmailResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [emailResendCooldown]);

  useEffect(() => {
    if (phoneResendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setPhoneResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [phoneResendCooldown]);

  useEffect(() => {
    if (otpPrioritySection === 'email' && emailOtpSent) {
      setOpenSection('email');
      return;
    }
    if (otpPrioritySection === 'phone' && phoneOtpSent) {
      setOpenSection('phone');
      return;
    }
    if (emailOtpSent) {
      setOpenSection('email');
      return;
    }
    if (phoneOtpSent) {
      setOpenSection('phone');
      return;
    }
    if (otpPrioritySection !== null) {
      setOtpPrioritySection(null);
    }
  }, [emailOtpSent, otpPrioritySection, phoneOtpSent]);

  const setAvailabilityState = useCallback(
    (field: keyof AvailabilityState, status: AvailabilityStatus, detail?: string) => {
      setAvailability((prev) => ({
        ...prev,
        [field]: { status, detail },
      }));
    },
    []
  );

  const validateEmailAvailability = useCallback(
    async (email: string) => {
      if (isEmailOtpLocked) {
        return;
      }
      const normalized = email.trim();
      if (!normalized || !emailChanged) {
        setAvailabilityState('email', 'idle');
        return;
      }
      if (!emailRegex.test(normalized)) {
        setAvailabilityState('email', 'error', 'Ingresa un correo válido.');
        return;
      }

      try {
        setAvailabilityState('email', 'checking');
        const response = await auth.checkEmailAvailability({ email: normalized });
        if (response.available) {
          setAvailabilityState('email', 'available');
          return;
        }
        setAvailabilityState(
          'email',
          'unavailable',
          response.detail || 'Este correo ya está en uso.'
        );
      } catch (error) {
        setAvailabilityState(
          'email',
          'error',
          mapAvailabilityError(error, 'No se pudo validar el correo.')
        );
      }
    },
    [auth, emailChanged, isEmailOtpLocked, setAvailabilityState]
  );

  const validateUsernameAvailability = useCallback(
    async (username: string) => {
      const normalized = username.trim();
      if (!normalized || !usernameChanged) {
        setAvailabilityState('username', 'idle');
        return;
      }
      if (normalized.length < 3) {
        setAvailabilityState(
          'username',
          'error',
          'El usuario debe tener al menos 3 caracteres.'
        );
        return;
      }

      try {
        setAvailabilityState('username', 'checking');
        const response = await auth.checkUsernameAvailability({ username: normalized });
        if (response.available) {
          setAvailabilityState('username', 'available');
          return;
        }
        setAvailabilityState(
          'username',
          'unavailable',
          response.detail || 'Este usuario ya está en uso.'
        );
      } catch (error) {
        setAvailabilityState(
          'username',
          'error',
          mapAvailabilityError(error, 'No se pudo validar el usuario.')
        );
      }
    },
    [auth, setAvailabilityState, usernameChanged]
  );

  const validatePhoneAvailability = useCallback(
    async (phone: string) => {
      if (isPhoneOtpLocked) {
        return;
      }
      if (!phone || !phoneChanged) {
        setAvailabilityState('phone', 'idle');
        return;
      }
      if (!isValidE164Phone(phone)) {
        setAvailabilityState('phone', 'error', 'Ingresa un teléfono válido.');
        return;
      }

      try {
        setAvailabilityState('phone', 'checking');
        const response = await auth.checkPhoneAvailability({ phone });
        if (response.available) {
          setAvailabilityState('phone', 'available');
          return;
        }
        setAvailabilityState(
          'phone',
          'unavailable',
          response.detail || 'Este teléfono ya está en uso.'
        );
      } catch (error) {
        setAvailabilityState(
          'phone',
          'error',
          mapAvailabilityError(error, 'No se pudo validar el teléfono.')
        );
      }
    },
    [auth, isPhoneOtpLocked, phoneChanged, setAvailabilityState]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void validateEmailAvailability(emailValue);
    }, 350);
    return () => clearTimeout(timer);
  }, [emailValue, validateEmailAvailability]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void validateUsernameAvailability(usernameValue);
    }, 350);
    return () => clearTimeout(timer);
  }, [usernameValue, validateUsernameAvailability]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void validatePhoneAvailability(fullPhone);
    }, 350);
    return () => clearTimeout(timer);
  }, [fullPhone, validatePhoneAvailability]);

  const requestEmailOtp = useCallback(async () => {
    if (emailResendCooldown > 0) {
      return;
    }
    const email = emailValue.trim();
    if (!emailChanged || !email) {
      Toast.show({
        type: 'info',
        text1: 'Sin cambios de correo',
        text2: 'Modifica tu correo para solicitar la verificación.',
      });
      return;
    }
    const isEmailValid = await trigger('email');
    if (!isEmailValid) {
      Toast.show({
        type: 'error',
        text1: 'Correo inválido',
      });
      return;
    }

    setIsSendingEmailOtp(true);
    try {
      const availabilityResponse = await auth.checkEmailAvailability({ email });
      if (!availabilityResponse.available) {
        setAvailabilityState(
          'email',
          'unavailable',
          availabilityResponse.detail || 'Este correo ya está en uso.'
        );
        Toast.show({
          type: 'error',
          text1: 'Correo no disponible',
          text2: availabilityResponse.detail || 'Este correo ya está en uso.',
        });
        return;
      }
      setAvailabilityState('email', 'available');
      await auth.requestContactVerification({
        channel: 'email',
        email,
      });
      setEmailOtpSent(true);
      setEmailResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setOtpPrioritySection('email');
      setOpenSection('email');
      Toast.show({
        type: 'success',
        text1: 'Código enviado',
        text2: 'Revisa tu correo para continuar.',
      });
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'No se pudo enviar el código',
        text2: parsed.rootMessage || 'Inténtalo de nuevo.',
      });
    } finally {
      setIsSendingEmailOtp(false);
    }
  }, [auth, emailChanged, emailResendCooldown, emailValue, setAvailabilityState, trigger]);

  const requestPhoneOtp = useCallback(async () => {
    if (phoneResendCooldown > 0) {
      return;
    }
    if (!phoneChanged || !fullPhone) {
      Toast.show({
        type: 'info',
        text1: 'Sin cambios de teléfono',
        text2: 'Modifica tu teléfono para solicitar la verificación.',
      });
      return;
    }

    const isPhoneValid = await trigger(['phoneCountryCode', 'phoneNumber']);
    if (!isPhoneValid) {
      Toast.show({
        type: 'error',
        text1: 'Teléfono inválido',
      });
      return;
    }

    setIsSendingPhoneOtp(true);
    try {
      const availabilityResponse = await auth.checkPhoneAvailability({ phone: fullPhone });
      if (!availabilityResponse.available) {
        setAvailabilityState(
          'phone',
          'unavailable',
          availabilityResponse.detail || 'Este teléfono ya está en uso.'
        );
        Toast.show({
          type: 'error',
          text1: 'Teléfono no disponible',
          text2: availabilityResponse.detail || 'Este teléfono ya está en uso.',
        });
        return;
      }
      setAvailabilityState('phone', 'available');
      await auth.requestContactVerification({
        channel: 'sms',
        phone: fullPhone,
      });
      setPhoneOtpSent(true);
      setPhoneResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setOtpPrioritySection('phone');
      setOpenSection('phone');
      Toast.show({
        type: 'success',
        text1: 'Código enviado',
        text2: 'Revisa tus mensajes para continuar.',
      });
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'No se pudo enviar el código',
        text2: parsed.rootMessage || 'Inténtalo de nuevo.',
      });
    } finally {
      setIsSendingPhoneOtp(false);
    }
  }, [auth, fullPhone, phoneChanged, phoneResendCooldown, setAvailabilityState, trigger]);

  const verifyEmailOtp = useCallback(async () => {
    const code = emailOtpCodeValue.trim();
    const email = emailValue.trim();
    if (!code || !email) {
      Toast.show({
        type: 'info',
        text1: 'Código requerido',
      });
      return;
    }

    setIsVerifyingEmailOtp(true);
    try {
      const response = (await auth.verifyContactVerification({
        channel: 'email',
        code,
        email,
      })) as Record<string, unknown>;
      const token = String(
        response.verification_proof_token ?? response.verificationProofToken ?? ''
      );
      if (!token) {
        throw new Error('No se recibió token de verificación.');
      }
      setEmailVerificationToken(token);
      setEmailOtpSent(false);
      setValue('emailOtpCode', '');
      setOpenSection(null);
      Toast.show({
        type: 'success',
        text1: 'Correo verificado',
      });
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'Código inválido',
        text2: parsed.rootMessage || 'Revisa el código e inténtalo de nuevo.',
      });
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  }, [auth, emailOtpCodeValue, emailValue, setValue]);

  const verifyPhoneOtp = useCallback(async () => {
    const code = phoneOtpCodeValue.trim();
    if (!code || !fullPhone) {
      Toast.show({
        type: 'info',
        text1: 'Código requerido',
      });
      return;
    }

    setIsVerifyingPhoneOtp(true);
    try {
      const response = (await auth.verifyContactVerification({
        channel: 'sms',
        code,
        phone: fullPhone,
      })) as Record<string, unknown>;
      const token = String(
        response.verification_proof_token ?? response.verificationProofToken ?? ''
      );
      if (!token) {
        throw new Error('No se recibió token de verificación.');
      }
      setPhoneVerificationToken(token);
      setPhoneOtpSent(false);
      setValue('phoneOtpCode', '');
      setOpenSection(null);
      Toast.show({
        type: 'success',
        text1: 'Teléfono verificado',
      });
    } catch (error) {
      const parsed = parseAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'Código inválido',
        text2: parsed.rootMessage || 'Revisa el código e inténtalo de nuevo.',
      });
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  }, [auth, fullPhone, phoneOtpCodeValue, setValue]);

  const unlockEmailVerificationFlow = useCallback(() => {
    setEmailOtpSent(false);
    setEmailVerificationToken(null);
    setEmailResendCooldown(0);
    setValue('emailOtpCode', '');
    setAvailabilityState('email', 'idle');
    setOtpPrioritySection((current) => (current === 'email' ? null : current));
  }, [setAvailabilityState, setValue]);

  const unlockPhoneVerificationFlow = useCallback(() => {
    setPhoneOtpSent(false);
    setPhoneVerificationToken(null);
    setPhoneResendCooldown(0);
    setValue('phoneOtpCode', '');
    setAvailabilityState('phone', 'idle');
    setOtpPrioritySection((current) => (current === 'phone' ? null : current));
  }, [setAvailabilityState, setValue]);

  const hasBlockingAvailability =
    availability.email.status === 'unavailable' ||
    availability.username.status === 'unavailable' ||
    availability.phone.status === 'unavailable';

  const isCheckingAvailability =
    availability.email.status === 'checking' ||
    availability.username.status === 'checking' ||
    availability.phone.status === 'checking';

  const requiresContactVerification =
    contactVerificationEnabled &&
    ((emailChanged && Boolean(emailValue.trim())) || (phoneChanged && Boolean(fullPhone)));

  const isContactVerificationBlocked =
    (contactVerificationEnabled &&
      emailChanged &&
      Boolean(emailValue.trim()) &&
      !emailVerificationToken) ||
    (contactVerificationEnabled && phoneChanged && Boolean(fullPhone) && !phoneVerificationToken);
  const hasPendingOtp = emailOtpSent || phoneOtpSent;
  const hasPendingChangesForExit =
    hasChanges ||
    Boolean(emailOtpCodeValue.trim()) ||
    Boolean(phoneOtpCodeValue.trim()) ||
    hasPendingOtp;
  const emailResendLabel =
    emailResendCooldown > 0 ? `Reenviar código (${emailResendCooldown}s)` : 'Reenviar código';
  const phoneResendLabel =
    phoneResendCooldown > 0 ? `Reenviar código (${phoneResendCooldown}s)` : 'Reenviar código';
  const hasEmailPendingSave = emailChanged;
  const hasPhonePendingSave = phoneChanged;
  const hasUsernamePendingSave = usernameChanged;
  const emailSummary = emailValue.trim() || 'Sin correo';
  const phoneSummary = fullPhone || 'Sin teléfono';
  const usernameSummary = usernameValue.trim() || 'Sin usuario';
  const showFooterActions = hasChanges;

  const submitForm = useCallback(
    async (values: FormValues) => {
      const email = values.email.trim();
      const username = values.username.trim();
      const phoneDigits = normalizeDigits(values.phoneNumber);
      const phoneCountry = resolveCountryCodeValue(values.phoneCountryCode);
      const phone = phoneDigits ? buildE164Phone(phoneCountry, phoneDigits) : '';

      if (!hasChanges) {
        Toast.show({
          type: 'info',
          text1: 'Sin cambios',
          text2: 'No hay cambios para guardar.',
        });
        return;
      }

      if (contactVerificationEnabled && emailChanged && email && !emailVerificationToken) {
        Toast.show({
          type: 'error',
          text1: 'Verifica tu correo',
          text2: 'Debes verificar el nuevo correo antes de guardar.',
        });
        return;
      }

      if (contactVerificationEnabled && phoneChanged && phone && !phoneVerificationToken) {
        Toast.show({
          type: 'error',
          text1: 'Verifica tu teléfono',
          text2: 'Debes verificar el nuevo teléfono antes de guardar.',
        });
        return;
      }

      try {
        await auth.updateAccount(
          {
            email: email || null,
            username: username || null,
            phone: phone || null,
            ...(emailVerificationToken
              ? { email_verification_proof_token: emailVerificationToken }
              : {}),
            ...(phoneVerificationToken
              ? { phone_verification_proof_token: phoneVerificationToken }
              : {}),
          } as any,
          'PATCH'
        );
        await auth.getMe().catch(() => undefined);
        Toast.show({
          type: 'success',
          text1: 'Datos actualizados',
          text2: 'Se guardaron los cambios de tu cuenta.',
        });
      } catch (error) {
        const parsed = parseAuthError(error);
        Toast.show({
          type: 'error',
          text1: 'Error al actualizar datos',
          text2: parsed.rootMessage || 'No se pudieron guardar los cambios.',
        });
      }
    },
    [
      auth,
      contactVerificationEnabled,
      emailChanged,
      emailVerificationToken,
      fullPhone,
      hasChanges,
      phoneChanged,
      phoneVerificationToken,
    ]
  );

  const isSubmitting = formState.isSubmitting;
  const canSave =
    canEdit &&
    hasChanges &&
    !isSubmitting &&
    !hasBlockingAvailability &&
    !isCheckingAvailability &&
    !isContactVerificationBlocked;

  const handleOpenSection = useCallback((section: PersonalDataSection) => {
    setOpenSection((current) => (current === section ? null : section));
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (allowExitRef.current || isSubmitting || !hasPendingChangesForExit) {
        return;
      }

      event.preventDefault();
      pendingActionRef.current = event.data?.action ?? null;
      setShowDiscardDialog(true);
    });

    return unsubscribe;
  }, [hasPendingChangesForExit, isSubmitting, navigation]);

  const handleStayEditing = useCallback(() => {
    setShowDiscardDialog(false);
    pendingActionRef.current = null;
  }, []);

  const handleConfirmDiscard = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setShowDiscardDialog(false);
    allowExitRef.current = true;

    if (action) {
      navigation.dispatch(action);
    } else {
      router.back();
    }

    setTimeout(() => {
      allowExitRef.current = false;
    }, 0);
  }, [navigation, router]);

  const renderAvailability = (
    state: AvailabilityFieldState,
    active: boolean,
    labels: {
      available: string;
      unavailable: string;
      checking: string;
      error: string;
    }
  ) => {
    if (!active) return null;
    if (state.status === 'idle') return null;
    if (state.status === 'checking') {
      return (
        <Text size="xs" className="text-typography-400">
          {labels.checking}
        </Text>
      );
    }
    if (state.status === 'available') {
      return null;
    }
    if (state.status === 'unavailable') {
      return (
        <Text size="xs" className="text-red-600 dark:text-red-400">
          {state.detail || labels.unavailable}
        </Text>
      );
    }
    return (
      <Text size="xs" className="text-red-600 dark:text-red-400">
        {state.detail || labels.error}
      </Text>
    );
  };

  const renderAvailabilitySlot = (state: AvailabilityFieldState, active: boolean) => {
    if (!active || state.status !== 'available') {
      return null;
    }

    return (
      <InputSlot className="px-3">
        <Icon as={CheckCircleIcon} size="sm" className="text-green-600 dark:text-green-400" />
      </InputSlot>
    );
  };

  const renderChangeButton = (onPress: () => void) => (
    <JBFormButton
      variant="link"
      action="primary"
      text="Cambiar"
      className="px-0 pb-4"
      isDisabled={!canEdit || isSubmitting}
      onPress={onPress}
    />
  );

  const renderPendingSaveBadge = (isVisible: boolean) => {
    if (!isVisible) return null;
    return (
      <Box className="rounded-full bg-amber-100 px-2 py-1 dark:bg-amber-900/30">
        <Text size="2xs" className="font-semibold text-amber-700 dark:text-amber-300">
          Pendiente por guardar
        </Text>
      </Box>
    );
  };

  return (
    <>
      <AuthScreenLayout
        subtitle="Actualiza tu correo, teléfono y usuario. Los cambios de contacto requieren verificación."
        footerClassName={showFooterActions ? "pt-4 pb-6" : undefined}
        footer={showFooterActions
          ? (
            <JBFormButton
              buttonType="save"
              text="Guardar cambios"
              showIcon={false}
              loading={isSubmitting}
              isDisabled={!canSave}
              onPress={() => void handleSubmit(submitForm as any)()}
            />
            )
          : undefined}
      >
        <Box className="w-full">
          <VStack space="lg">
            {!canEdit ? (
              <Text size="sm" className="text-typography-400">
                La edición de cuenta está deshabilitada para esta implementación.
              </Text>
            ) : null}

            {capabilities.canEditDefaultProfile ? (
              <Box className="rounded-2xl bg-background-150 px-4 py-4 dark:bg-background-200">
                <VStack space="sm">
                  <Text size="sm" className="text-typography-600 dark:text-typography-300">
                    Si deseas editar tu información personal como nombre y apellidos, hazlo desde tu perfil.
                  </Text>
                  <JBFormButton
                    variant="link"
                    action="primary"
                    text="Ir a editar información del perfil"
                    className="self-start px-0"
                    onPress={() => router.push('/user/profile' as any)}
                  />
                </VStack>
              </Box>
            ) : null}

            <Box className="rounded-2xl bg-background-150 px-4 py-4 dark:bg-background-200">
              <TouchableOpacity activeOpacity={0.85} onPress={() => handleOpenSection('email')}>
                <VStack space="xs" className="w-full">
                  <HStack className="items-center justify-between">
                    <Text size="md" className="font-semibold text-typography-900 dark:text-typography-50">
                      Correo electrónico
                    </Text>
                    <HStack space="sm" className="items-center">
                      {renderPendingSaveBadge(hasEmailPendingSave)}
                      <Text size="sm" className="font-medium text-typography-500 dark:text-typography-300">
                        {openSection === 'email' ? 'Ocultar' : 'Editar'}
                      </Text>
                    </HStack>
                  </HStack>
                  {openSection !== 'email' ? (
                    <Text size="sm" className="text-typography-500 dark:text-typography-300">
                      {emailSummary}
                    </Text>
                  ) : null}
                </VStack>
              </TouchableOpacity>

              {openSection === 'email' ? (
                <VStack space="sm" className="mt-3">
                  <HStack space="sm" className="items-end">
                    <Box className="flex-1">
                      <JBFormInput
                        control={control}
                        fieldName="email"
                        label=""
                        placeholder="tu-correo@dominio.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        isDisabled={!canEdit || isSubmitting || isEmailOtpLocked}
                        slotAfter={renderAvailabilitySlot(availability.email, emailChanged)}
                        containerClassName="mb-0"
                      />
                    </Box>
                    {isEmailOtpLocked ? renderChangeButton(() => unlockEmailVerificationFlow()) : null}
                  </HStack>
                  {renderAvailability(availability.email, emailChanged, {
                    available: 'Correo disponible.',
                    unavailable: 'Este correo ya está en uso.',
                    checking: 'Validando correo...',
                    error: 'No se pudo validar el correo.',
                  })}

                  {contactVerificationEnabled && emailChanged ? (
                    <VStack space="sm" className="rounded-xl bg-background-100 px-3 py-3 dark:bg-background-50/10">
                      <Text size="xs" className="text-typography-500 dark:text-typography-300">
                        Verifica tu nuevo correo con el código que te enviaremos por email.
                      </Text>
                      <HStack space="sm" className="w-full items-center">
                        {!emailVerificationToken && !emailOtpSent ? (
                          <JBFormButton
                            variant="outline"
                            action="primary"
                            text="Enviar código"
                            className="w-full"
                            isDisabled={!canEdit || isSubmitting}
                            loading={isSendingEmailOtp}
                            onPress={() => void requestEmailOtp()}
                          />
                        ) : null}
                      </HStack>
                      {emailOtpSent ? (
                        <VStack space="sm">
                          <JBFormInput
                            control={control}
                            fieldName="emailOtpCode"
                            label="Código de verificación"
                            placeholder="Ingresa el código"
                            keyboardType="numeric"
                            returnKeyType="default"
                            autoComplete="one-time-code"
                            isDisabled={!canEdit || isSubmitting}
                          />
                          <JBFormButton
                            variant="outline"
                            action="primary"
                            text="Confirmar código"
                            isDisabled={!canEdit || isSubmitting}
                            loading={isVerifyingEmailOtp}
                            onPress={() => void verifyEmailOtp()}
                          />
                          <HStack className="justify-center">
                            <JBFormButton
                              variant="link"
                              action="primary"
                              text={emailResendLabel}
                              className="px-0"
                              isDisabled={!canEdit || isSubmitting || emailResendCooldown > 0}
                              loading={isSendingEmailOtp}
                              onPress={() => void requestEmailOtp()}
                            />
                          </HStack>
                        </VStack>
                      ) : null}
                    </VStack>
                  ) : null}
                </VStack>
              ) : null}
            </Box>

            <Box className="rounded-2xl bg-background-150 px-4 py-4 dark:bg-background-200">
              <TouchableOpacity activeOpacity={0.85} onPress={() => handleOpenSection('phone')}>
                <VStack space="xs" className="w-full">
                  <HStack className="items-center justify-between">
                    <Text size="md" className="font-semibold text-typography-900 dark:text-typography-50">
                      Teléfono
                    </Text>
                    <HStack space="sm" className="items-center">
                      {renderPendingSaveBadge(hasPhonePendingSave)}
                      <Text size="sm" className="font-medium text-typography-500 dark:text-typography-300">
                        {openSection === 'phone' ? 'Ocultar' : 'Editar'}
                      </Text>
                    </HStack>
                  </HStack>
                  {openSection !== 'phone' ? (
                    <Text size="sm" className="text-typography-500 dark:text-typography-300">
                      {phoneSummary}
                    </Text>
                  ) : null}
                </VStack>
              </TouchableOpacity>

              {openSection === 'phone' ? (
                <VStack space="sm" className="mt-3">
                  <JBFormPicker
                    control={control}
                    fieldName="phoneCountryCode"
                    label="Código de país"
                    items={COUNTRY_CALLING_CODE_OPTIONS}
                    isDisabled={!canEdit || isSubmitting || isPhoneOtpLocked}
                    sheetTitle="Selecciona código de país"
                    iconClassName="hidden"
                  />
                  <HStack space="sm" className="items-end">
                    <Box className="flex-1">
                      <JBFormInput
                        control={control}
                        fieldName="phoneNumber"
                        label="Número telefónico"
                        placeholder="Ej. 4771234567"
                        keyboardType="phone-pad"
                        returnKeyType="none"
                        isDisabled={!canEdit || isSubmitting || isPhoneOtpLocked}
                        slotAfter={renderAvailabilitySlot(availability.phone, phoneChanged)}
                        onChangeCustom={(value: string, onChange: (val: string) => void) => {
                          onChange(normalizeDigits(value));
                        }}
                        containerClassName="mb-0"
                      />
                    </Box>
                    {isPhoneOtpLocked ? renderChangeButton(() => unlockPhoneVerificationFlow()) : null}
                  </HStack>
                  {renderAvailability(availability.phone, phoneChanged, {
                    available: 'Teléfono disponible.',
                    unavailable: 'Este teléfono ya está en uso.',
                    checking: 'Validando teléfono...',
                    error: 'No se pudo validar el teléfono.',
                  })}

                  {contactVerificationEnabled && phoneChanged ? (
                    <VStack space="sm" className="rounded-xl bg-background-100 px-3 py-3 dark:bg-background-50/10">
                      <Text size="xs" className="text-typography-500 dark:text-typography-300">
                        Verifica tu nuevo teléfono con el código que enviaremos por SMS.
                      </Text>
                      <HStack space="sm" className="w-full items-center">
                        {!phoneVerificationToken && !phoneOtpSent ? (
                          <JBFormButton
                            variant="outline"
                            action="primary"
                            text="Enviar código"
                            className="w-full"
                            isDisabled={!canEdit || isSubmitting}
                            loading={isSendingPhoneOtp}
                            onPress={() => void requestPhoneOtp()}
                          />
                        ) : null}
                      </HStack>
                      {phoneOtpSent ? (
                        <VStack space="sm">
                          <JBFormInput
                            control={control}
                            fieldName="phoneOtpCode"
                            label="Código de verificación"
                            placeholder="Ingresa el código"
                            keyboardType="numeric"
                            returnKeyType="default"
                            autoComplete="one-time-code"
                            isDisabled={!canEdit || isSubmitting}
                          />
                          <JBFormButton
                            variant="outline"
                            action="primary"
                            text="Confirmar código"
                            isDisabled={!canEdit || isSubmitting}
                            loading={isVerifyingPhoneOtp}
                            onPress={() => void verifyPhoneOtp()}
                          />
                          <HStack className="justify-center">
                            <JBFormButton
                              variant="link"
                              action="primary"
                              text={phoneResendLabel}
                              className="px-0"
                              isDisabled={!canEdit || isSubmitting || phoneResendCooldown > 0}
                              loading={isSendingPhoneOtp}
                              onPress={() => void requestPhoneOtp()}
                            />
                          </HStack>
                        </VStack>
                      ) : null}
                    </VStack>
                  ) : null}
                </VStack>
              ) : null}
            </Box>

            <Box className="rounded-2xl bg-background-150 px-4 py-4 dark:bg-background-200">
              <TouchableOpacity activeOpacity={0.85} onPress={() => handleOpenSection('username')}>
                <VStack space="xs" className="w-full">
                  <HStack className="items-center justify-between">
                    <Text size="md" className="font-semibold text-typography-900 dark:text-typography-50">
                      Nombre de usuario
                    </Text>
                    <HStack space="sm" className="items-center">
                      {renderPendingSaveBadge(hasUsernamePendingSave)}
                      <Text size="sm" className="font-medium text-typography-500 dark:text-typography-300">
                        {openSection === 'username' ? 'Ocultar' : 'Editar'}
                      </Text>
                    </HStack>
                  </HStack>
                  {openSection !== 'username' ? (
                    <Text size="sm" className="text-typography-500 dark:text-typography-300">
                      {usernameSummary}
                    </Text>
                  ) : null}
                </VStack>
              </TouchableOpacity>

              {openSection === 'username' ? (
                <VStack space="sm" className="mt-3">
                  <JBFormInput
                    control={control}
                    fieldName="username"
                    label="Usuario"
                    placeholder="Tu nombre de usuario"
                    autoCapitalize="none"
                    isDisabled={!canEdit || isSubmitting}
                    slotAfter={renderAvailabilitySlot(availability.username, usernameChanged)}
                  />
                  {renderAvailability(availability.username, usernameChanged, {
                    available: 'Usuario disponible.',
                    unavailable: 'Este usuario ya está en uso.',
                    checking: 'Validando usuario...',
                    error: 'No se pudo validar el usuario.',
                  })}
                </VStack>
              ) : null}
            </Box>

            {requiresContactVerification ? (
              <Text size="xs" className="text-typography-400">
                Debes verificar los cambios de correo y teléfono antes de guardar.
              </Text>
            ) : null}
          </VStack>
        </Box>
      </AuthScreenLayout>

      <ConfirmationDialog
        open={showDiscardDialog}
        setOpen={(open) => {
          if (!open) {
            setShowDiscardDialog(false);
            pendingActionRef.current = null;
          }
        }}
        showIcon={false}
        title="Descartar cambios"
        content="Si sales ahora, perderás los cambios y cualquier verificación pendiente."
        agreeText="Salir"
        agreeColor="negative"
        agreeVariant="solid"
        disagreeText="Seguir editando"
        disagreeColor="secondary"
        disagreeVariant="outline"
        onAgree={() => void handleConfirmDiscard()}
        onDisAgree={() => void handleStayEditing()}
      />
    </>
  );
}
