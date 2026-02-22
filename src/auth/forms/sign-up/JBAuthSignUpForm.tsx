import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import {
  JBFormCheckbox,
  JBFormDateTimePicker,
  JBFormInput,
  JBFormPasswordInput,
  JBFormPicker,
  JBSelectOption
} from '../../../forms';
import { GENDERS, GENDER_SELECT_OPTIONS } from '../../constants';
import { RegisterPayload } from '../../types';
import { JBAuthPrimaryButton } from '../../ui';
import { getFormattedDate } from '../../../utils/data-format';
import { parseAuthError } from '../errorParser';
import { getDjangoLikePasswordError, isPasswordTooSimilar } from '../password/passwordValidation';

const getMaximumBirthDate = (minimumAge: number): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setFullYear(date.getFullYear() - minimumAge);
  return date;
};

const createSignUpSchema = (minimumAge: number) =>
  z
    .object({
      firstName: z.string().nonempty('Debes ingresar el nombre'),
      lastName1: z.string().nonempty('Debes ingresar el primer apellido'),
      lastName2: z.string().optional(),
      email: z.string().email('Debes ingresar un correo válido').nonempty('Debes ingresar un correo'),
      birthday: z.date().optional(),
      gender: z.any().optional(),
      role: z.any().optional(),
      password: z.string().nonempty('Debes ingresar la contraseña.'),
      passwordConfirm: z.string().nonempty('La confirmación de contraseña es obligatoria'),
      acceptTermsConditions: z.boolean().refine((value) => value === true, 'Debes aceptar los términos y condiciones.')
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Las contraseñas deben coincidir',
      path: ['passwordConfirm']
    })
    .superRefine((data, ctx) => {
      const passwordError = getDjangoLikePasswordError(data.password);
      if (passwordError) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: passwordError, path: ['password'] });
      }

      if (isPasswordTooSimilar(data.password, [data.email, data.firstName, data.lastName1, data.lastName2])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La contraseña es demasiado similar a tus datos personales.',
          path: ['password']
        });
      }

      const birthdayLimit = getMaximumBirthDate(minimumAge);
      if (!data.birthday) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes seleccionar la fecha de nacimiento',
          path: ['birthday']
        });
      } else if (data.birthday > birthdayLimit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Debes tener al menos ${minimumAge} años para registrarte.`,
          path: ['birthday']
        });
      }

      const genderValue = typeof data.gender === 'string' ? data.gender : data.gender?.value;
      if (genderValue && !GENDERS.includes(genderValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Género inválido.',
          path: ['gender']
        });
      }
    });

const defaultSignUpSchema = createSignUpSchema(18);
export type JBAuthSignUpFormValues = z.infer<typeof defaultSignUpSchema>;

export type JBAuthSignUpFormProps = {
  defaultValues?: Partial<JBAuthSignUpFormValues>;
  minimumAge?: number;
  loading?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  showSubmitButton?: boolean;
  onFormStateChange?: (state: {
    submit: () => void;
    isValid: boolean;
    isLoading: boolean;
    canSubmit: boolean;
  }) => void;
  roleOptions?: Array<JBSelectOption<string> & { allowSignup?: boolean }>;
  defaultRole?: string;
  onSubmit: (values: RegisterPayload) => unknown | Promise<unknown>;
};

const defaults: JBAuthSignUpFormValues = {
  firstName: '',
  lastName1: '',
  lastName2: '',
  email: '',
  birthday: undefined,
  gender: undefined,
  role: '',
  password: '',
  passwordConfirm: '',
  acceptTermsConditions: false
};

export function JBAuthSignUpForm(props: JBAuthSignUpFormProps) {
  const {
    defaultValues,
    minimumAge = 18,
    loading = false,
    disabled = false,
    submitLabel = 'Crear cuenta',
    showSubmitButton = true,
    onFormStateChange,
    roleOptions,
    defaultRole,
    onSubmit
  } = props;

  const signupRoleOptions = useMemo(
    () =>
      (roleOptions ?? []).filter(
        (roleOption) => roleOption.allowSignup === true || (roleOption as any).allowSignUp === true,
      ),
    [roleOptions]
  );
  const maximumBirthDate = useMemo(() => getMaximumBirthDate(minimumAge), [minimumAge]);
  const signUpSchema = useMemo(() => createSignUpSchema(minimumAge), [minimumAge]);

  const resolvedDefaultGender = useMemo(
    () => GENDER_SELECT_OPTIONS.find((option) => option.value === defaultValues?.gender),
    [defaultValues?.gender]
  );
  const resolvedDefaultRoleValue = defaultValues?.role ?? defaultRole ?? signupRoleOptions[0]?.value ?? defaults.role;
  const resolvedDefaultRole = useMemo(
    () => signupRoleOptions.find((option) => option.value === resolvedDefaultRoleValue) ?? undefined,
    [resolvedDefaultRoleValue, signupRoleOptions]
  );
  const resolvedInitialValues = useMemo(
    () => ({
      ...defaults,
      ...(defaultValues ?? {}),
      gender: resolvedDefaultGender as any,
      role: resolvedDefaultRole as any,
    }),
    [defaultValues, resolvedDefaultGender, resolvedDefaultRole]
  );

  const { control, formState, handleSubmit, setError, clearErrors, trigger, watch, reset } = useForm<JBAuthSignUpFormValues>({
    mode: 'onChange',
    defaultValues: resolvedInitialValues,
    resolver: zodResolver(signUpSchema)
  });

  useEffect(() => {
    reset(resolvedInitialValues);
  }, [reset, resolvedInitialValues]);

  const password = useWatch({ control, name: 'password' });
  const passwordConfirm = useWatch({ control, name: 'passwordConfirm' });

  useEffect(() => {
    if (passwordConfirm) {
      void trigger('passwordConfirm');
    }
  }, [password, passwordConfirm, trigger]);

  useEffect(() => {
    const subscription = watch((_value, meta) => {
      if (meta.name) {
        clearErrors(meta.name as keyof JBAuthSignUpFormValues);
      }
      clearErrors('root');
    });

    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  const submitForm = useCallback(async (values: JBAuthSignUpFormValues) => {
    const genderValue = typeof values.gender === 'string' ? values.gender : values.gender?.value;
    const roleValue = typeof values.role === 'string' ? values.role : values.role?.value;
    try {
      await onSubmit({
        firstName: values.firstName,
        lastName1: values.lastName1,
        lastName2: values.lastName2 || undefined,
        username: null,
        email: values.email,
        birthday: values.birthday ? getFormattedDate(values.birthday) : undefined,
        gender: genderValue || undefined,
        password: values.password,
        passwordConfirm: values.passwordConfirm,
        role: roleValue || defaultRole || undefined,
        termsAndConditionsAccepted: values.acceptTermsConditions
      });
    } catch (error) {
      const parsed = parseAuthError(error, { username: 'email' });
      Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof JBAuthSignUpFormValues, { type: 'manual', message });
      });

      if (parsed.rootMessage) {
        Toast.show({
          type: 'error',
          text1: 'Error de registro',
          text2: parsed.rootMessage
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error de registro',
          text2: 'No se pudo crear la cuenta. Inténtalo de nuevo.'
        });
      }
    }
  }, [onSubmit, defaultRole, setError]);

  const isLoading = loading || formState.isSubmitting;
  const submitHandler = useCallback(() => {
    void handleSubmit(submitForm)();
  }, [handleSubmit, submitForm]);

  useEffect(() => {
    onFormStateChange?.({
      submit: submitHandler,
      isValid: formState.isValid,
      isLoading,
      canSubmit: !(disabled || !formState.isValid || isLoading)
    });
  }, [onFormStateChange, submitHandler, formState.isValid, isLoading, disabled]);

  return (
    <>
      <JBFormInput control={control} fieldName="firstName" label="Nombre(s)" isDisabled={disabled || isLoading} />
      <JBFormInput control={control} fieldName="lastName1" label="Primer apellido" isDisabled={disabled || isLoading} />
      <JBFormInput control={control} fieldName="lastName2" label="Segundo apellido" isDisabled={disabled || isLoading} />
      <JBFormInput
        control={control}
        fieldName="email"
        label="Correo electrónico"
        autoCapitalize="none"
        keyboardType="email-address"
        isDisabled={disabled || isLoading}
      />
      <JBFormDateTimePicker
        control={control}
        fieldName="birthday"
        label="Fecha de nacimiento"
        mode="date"
        maximumDate={maximumBirthDate}
        isDisabled={disabled || isLoading}
      />
      <JBFormPicker
        control={control}
        fieldName="gender"
        label="Género"
        items={GENDER_SELECT_OPTIONS}
        isDisabled={disabled || isLoading}
      />

      {signupRoleOptions.length > 1 ? (
        <JBFormPicker
          control={control}
          fieldName="role"
          label="Rol de perfil"
          items={signupRoleOptions}
          isDisabled={disabled || isLoading}
        />
      ) : null}

      <JBFormPasswordInput
        control={control}
        fieldName="password"
        label="Contraseña"
        isDisabled={disabled || isLoading}
        enforceDjangoLikeValidation
      />

      <JBFormPasswordInput
        control={control}
        fieldName="passwordConfirm"
        label="Confirmar contraseña"
        isDisabled={disabled || isLoading}
      />

      <JBFormCheckbox
        control={control}
        fieldName="acceptTermsConditions"
        label="Acepto términos y condiciones"
        labelClassName="hidden"
        isDisabled={disabled || isLoading}
      />

      {showSubmitButton ? (
        <JBAuthPrimaryButton
          label={submitLabel}
          loading={isLoading}
          disabled={disabled || !formState.isValid}
          onPress={submitHandler}
        />
      ) : null}
    </>
  );
}
