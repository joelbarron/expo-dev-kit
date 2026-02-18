import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { JBFormCheckbox, JBFormInput, JBFormPasswordInput, JBFormSelect, JBSelectOption } from '../../../forms';
import { DEFAULT_GENDER, GENDERS, GENDER_SELECT_OPTIONS } from '../../constants';
import { RegisterPayload } from '../../types';
import { JBAuthAlert, JBAuthPrimaryButton } from '../../ui';
import { parseAuthError } from '../errorParser';
import { getDjangoLikePasswordError, isPasswordTooSimilar } from '../password/passwordValidation';

const signUpSchema = z
  .object({
    firstName: z.string().nonempty('Debes ingresar el nombre'),
    lastName1: z.string().nonempty('Debes ingresar el primer apellido'),
    lastName2: z.string().optional(),
    email: z.string().email('Debes ingresar un correo válido').nonempty('Debes ingresar un correo'),
    birthday: z.string().optional(),
    gender: z.enum(GENDERS).optional(),
    role: z.string().optional(),
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
  });

export type JBAuthSignUpFormValues = z.infer<typeof signUpSchema>;

export type JBAuthSignUpFormProps = {
  defaultValues?: Partial<JBAuthSignUpFormValues>;
  loading?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  roleOptions?: Array<JBSelectOption<string> & { allowSignup?: boolean }>;
  defaultRole?: string;
  onSubmit: (values: RegisterPayload) => unknown | Promise<unknown>;
};

const defaults: JBAuthSignUpFormValues = {
  firstName: '',
  lastName1: '',
  lastName2: '',
  email: '',
  birthday: '',
  gender: DEFAULT_GENDER,
  role: '',
  password: '',
  passwordConfirm: '',
  acceptTermsConditions: false
};

export function JBAuthSignUpForm(props: JBAuthSignUpFormProps) {
  const {
    defaultValues,
    loading = false,
    disabled = false,
    submitLabel = 'Crear cuenta',
    roleOptions,
    defaultRole,
    onSubmit
  } = props;

  const signupRoleOptions = useMemo(
    () => (roleOptions ?? []).filter((roleOption) => roleOption.allowSignup !== false),
    [roleOptions]
  );

  const resolvedDefaultRole = defaultValues?.role ?? defaultRole ?? signupRoleOptions[0]?.value ?? defaults.role;

  const { control, formState, handleSubmit, setError, clearErrors, trigger, watch } = useForm<JBAuthSignUpFormValues>({
    mode: 'onChange',
    defaultValues: {
      ...defaults,
      role: resolvedDefaultRole,
      ...(defaultValues ?? {})
    },
    resolver: zodResolver(signUpSchema)
  });

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

  const isLoading = loading || formState.isSubmitting;

  const submitForm = async (values: JBAuthSignUpFormValues) => {
    try {
      await onSubmit({
        firstName: values.firstName,
        lastName1: values.lastName1,
        lastName2: values.lastName2 || undefined,
        username: null,
        email: values.email,
        birthday: values.birthday || undefined,
        gender: values.gender || undefined,
        password: values.password,
        passwordConfirm: values.passwordConfirm,
        role: values.role || defaultRole || undefined,
        termsAndConditionsAccepted: values.acceptTermsConditions
      });
    } catch (error) {
      const parsed = parseAuthError(error, { username: 'email' });
      Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof JBAuthSignUpFormValues, { type: 'manual', message });
      });

      if (parsed.rootMessage) {
        setError('root', { type: 'manual', message: parsed.rootMessage });
      } else {
        setError('root', { type: 'manual', message: 'No se pudo crear la cuenta. Inténtalo de nuevo.' });
      }
    }
  };

  return (
    <>
      {formState.errors.root?.message ? <JBAuthAlert type="error" message={formState.errors.root.message} /> : null}

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
      <JBFormInput control={control} fieldName="birthday" label="Fecha de nacimiento (YYYY-MM-DD)" isDisabled={disabled || isLoading} />
      <JBFormSelect control={control} fieldName="gender" label="Género" options={GENDER_SELECT_OPTIONS} isDisabled={disabled || isLoading} />

      {signupRoleOptions.length > 0 ? (
        <JBFormSelect
          control={control}
          fieldName="role"
          label="Rol de perfil"
          options={signupRoleOptions}
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
        isDisabled={disabled || isLoading}
      />

      <JBAuthPrimaryButton
        label={submitLabel}
        loading={isLoading}
        disabled={disabled || !formState.isValid}
        onPress={handleSubmit(submitForm)}
      />
    </>
  );
}
