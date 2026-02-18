import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";
import { z } from "zod";

import { JBFormInput, JBFormPasswordInput } from "../../../forms";
import { Button, ButtonText, VStack } from "../../../ui";
import { JBAuthPrimaryButton, JBAuthSecondaryButton } from "../../ui";
import { parseAuthError } from "../errorParser";
import { getDjangoLikePasswordError } from "../password/passwordValidation";

export type JBAuthPasswordSignInFormValues = {
  login: string;
  password: string;
};

export type JBAuthPasswordSignInFormProps = {
  defaultValues?: Partial<JBAuthPasswordSignInFormValues>;
  loading?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  forgotPasswordLabel?: string;
  loginLabel?: string;
  passwordLabel?: string;
  verifyAccountLabel?: string;
  onPressForgotPassword?: () => void;
  onPressVerifyAccount?: (email?: string) => void;
  onSubmit: (
    values: JBAuthPasswordSignInFormValues,
  ) => unknown | Promise<unknown>;
};

const signInSchema = z.object({
  login: z.string().nonempty("Debes ingresar tu usuario o correo"),
  password: z.string().superRefine((value, ctx) => {
    const passwordError = getDjangoLikePasswordError(value);
    if (passwordError) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: passwordError });
    }
  }),
});

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function JBAuthPasswordSignInForm(props: JBAuthPasswordSignInFormProps) {
  const {
    defaultValues,
    loading = false,
    disabled = false,
    submitLabel = "Iniciar sesión",
    forgotPasswordLabel = "¿Olvidaste tu contraseña?",
    loginLabel = "Usuario o correo",
    passwordLabel = "Contraseña",
    verifyAccountLabel = "Ir a verificar cuenta",
    onPressForgotPassword,
    onPressVerifyAccount,
    onSubmit,
  } = props;

  const { control, formState, handleSubmit, setError, clearErrors, watch } =
    useForm<JBAuthPasswordSignInFormValues>({
      mode: "onChange",
      defaultValues: {
        login: defaultValues?.login ?? "",
        password: defaultValues?.password ?? "",
      },
      resolver: zodResolver(signInSchema),
    });

  const loginValue = watch("login");
  const passwordValue = watch("password");
  const isLoading = loading || formState.isSubmitting;

  useEffect(() => {
    const subscription = watch((_value, meta) => {
      if (meta.name) {
        clearErrors(meta.name as keyof JBAuthPasswordSignInFormValues);
      }
      clearErrors("root");
    });

    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  const shouldShowVerifyAccountCta = useMemo(() => {
    const message = formState.errors.root?.message;
    if (!message) {
      return false;
    }
    const normalizedMessage = normalizeText(message);
    return (
      normalizedMessage.includes("no esta verificada") ||
      normalizedMessage.includes("not verified")
    );
  }, [formState.errors.root?.message]);

  const submitForm = async (values: JBAuthPasswordSignInFormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const parsed = parseAuthError(error, { username: "login" });
      (["login", "password"] as const).forEach((field) => {
        if (parsed.fieldErrors[field]) {
          setError(field, {
            type: "manual",
            message: parsed.fieldErrors[field],
          });
        }
      });

      const rootMessage =
        parsed.rootMessage || parsed.fieldErrors.nonFieldErrors;
      const toastMessage =
        rootMessage || "No se pudo iniciar sesión. Inténtalo de nuevo.";
      setError("root", {
        type: "manual",
        message: toastMessage,
      });

      Toast.show({
        type: "error",
        text1: "Error de inicio de sesión",
        text2: toastMessage,
      });
    }
  };

  return (
    <VStack space="lg">
      <JBFormInput
        control={control}
        fieldName="login"
        label={loginLabel}
        placeholder="Ingresa tu usuario o correo"
        autoCapitalize="none"
        isDisabled={disabled || isLoading}
      />

      <JBFormPasswordInput
        control={control}
        fieldName="password"
        label={passwordLabel}
        placeholder="Ingresa tu contraseña"
        isDisabled={disabled || isLoading}
      />

      {onPressForgotPassword ? (
        <Button
          variant="link"
          action="primary"
          size="md"
          onPress={onPressForgotPassword}
          isDisabled={disabled || isLoading}
          className="mb-4 self-end px-0"
        >
          <ButtonText className="text-sm font-semibold text-primary-600 dark:text-primary-300">
            {forgotPasswordLabel}
          </ButtonText>
        </Button>
      ) : null}

      <JBAuthPrimaryButton
        className="mt-6"
        label={submitLabel}
        loading={isLoading}
        disabled={disabled || !loginValue?.trim() || !passwordValue}
        onPress={handleSubmit(submitForm)}
      />

      {shouldShowVerifyAccountCta && onPressVerifyAccount ? (
        <JBAuthSecondaryButton
          label={verifyAccountLabel}
          className="mt-6"
          onPress={() => onPressVerifyAccount(loginValue)}
        />
      ) : null}
    </VStack>
  );
}
