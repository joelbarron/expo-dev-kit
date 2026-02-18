import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";
import { z } from "zod";

import { JBFormInput, JBFormSelect, JBSelectOption } from "../../../forms";
import { VStack } from "../../../ui";
import {
  COUNTRY_CALLING_CODE_OPTIONS,
  DEFAULT_OTP_COUNTRY_CODE,
} from "../../constants";
import { JBAuthPrimaryButton, JBAuthSecondaryButton } from "../../ui";
import { parseAuthError } from "../errorParser";

export type JBAuthOtpSignInFormValues = {
  countryCode: string;
  phone: string;
  code?: string;
};

export type JBAuthOtpSignInFormProps = {
  defaultValues?: Partial<JBAuthOtpSignInFormValues>;
  countryCodeOptions?: JBSelectOption<string>[];
  requestRoleSelection?: () => Promise<string | undefined>;
  loading?: boolean;
  onRequestOtp: (values: { phone: string }) => unknown | Promise<unknown>;
  onVerifyOtp: (values: {
    phone: string;
    code: string;
    role?: string;
  }) => unknown | Promise<unknown>;
  onBackToPassword?: () => void;
};

const otpSchema = z.object({
  countryCode: z.string().nonempty("Selecciona la lada"),
  phone: z.string().nonempty("Debes ingresar tu teléfono"),
  code: z.string().optional(),
});

const parseBooleanLike = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number")
    return value === 1 ? true : value === 0 ? false : undefined;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
};

const getUserExistsFromResponse = (response: unknown): boolean | undefined => {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const data = response as Record<string, unknown>;
  return (
    parseBooleanLike(data.userExist) ??
    parseBooleanLike(data.userExists) ??
    parseBooleanLike(data.user_exist) ??
    parseBooleanLike(data.user_exists)
  );
};

export function JBAuthOtpSignInForm(props: JBAuthOtpSignInFormProps) {
  const {
    defaultValues,
    countryCodeOptions,
    requestRoleSelection,
    loading = false,
    onRequestOtp,
    onVerifyOtp,
    onBackToPassword,
  } = props;

  const resolvedOptions = countryCodeOptions ?? COUNTRY_CALLING_CODE_OPTIONS;
  const defaultCountryCode = resolvedOptions.some(
    (item) => item.value === DEFAULT_OTP_COUNTRY_CODE,
  )
    ? DEFAULT_OTP_COUNTRY_CODE
    : (resolvedOptions[0]?.value ?? DEFAULT_OTP_COUNTRY_CODE);

  const [otpRequested, setOtpRequested] = useState(false);
  const [shouldSelectRoleOnVerify, setShouldSelectRoleOnVerify] =
    useState(false);

  const { control, formState, handleSubmit, setError, clearErrors, watch } =
    useForm<JBAuthOtpSignInFormValues>({
      mode: "onChange",
      defaultValues: {
        countryCode: defaultValues?.countryCode ?? defaultCountryCode,
        phone: defaultValues?.phone ?? "",
        code: defaultValues?.code ?? "",
      },
      resolver: zodResolver(otpSchema),
    });

  const countryCode = watch("countryCode");
  const phone = watch("phone");
  const code = watch("code");

  useEffect(() => {
    const subscription = watch((_value, meta) => {
      if (meta.name) {
        clearErrors(meta.name as keyof JBAuthOtpSignInFormValues);
      }
      clearErrors("root");
    });

    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  const isLoading = loading || formState.isSubmitting;

  const applySubmitError = (error: unknown) => {
    const parsed = parseAuthError(error);
    const message =
      parsed.rootMessage || "No se pudo completar la operación OTP.";
    setError("root", { type: "manual", message });
    Toast.show({
      type: "error",
      text1: "Error en OTP",
      text2: message,
    });
  };

  const onSubmitForm = async (values: JBAuthOtpSignInFormValues) => {
    try {
      if (!otpRequested) {
        const response = await onRequestOtp({
          phone: `${values.countryCode}${values.phone}`.replace(/\s+/g, ""),
        });
        const userExists = getUserExistsFromResponse(response);
        setShouldSelectRoleOnVerify(
          Boolean(requestRoleSelection) && userExists === false,
        );
        setOtpRequested(true);
        Toast.show({
          type: "success",
          text1: "OTP enviado",
          text2: "Revisa tu teléfono para continuar.",
        });
        return;
      }

      if (!values.code?.trim()) {
        setError("code", {
          type: "manual",
          message: "Debes ingresar el código OTP",
        });
        return;
      }

      let selectedRole: string | undefined;
      if (shouldSelectRoleOnVerify && requestRoleSelection) {
        selectedRole = await requestRoleSelection();
        if (!selectedRole) {
          return;
        }
      }

      await onVerifyOtp({
        phone: `${values.countryCode}${values.phone}`.replace(/\s+/g, ""),
        code: values.code,
        role: selectedRole,
      });
    } catch (error) {
      applySubmitError(error);
    }
  };

  return (
    <VStack space="lg">
      <JBFormSelect
        control={control}
        fieldName="countryCode"
        label="Lada"
        options={resolvedOptions}
        isDisabled={isLoading || otpRequested}
      />

      <JBFormInput
        control={control}
        fieldName="phone"
        label="Teléfono"
        placeholder="Ingresa tu teléfono"
        keyboardType="phone-pad"
        isDisabled={isLoading || otpRequested}
      />

      {otpRequested ? (
        <JBFormInput
          control={control}
          fieldName="code"
          label="Código OTP"
          placeholder="Ingresa el código"
          keyboardType="number-pad"
          isDisabled={isLoading}
        />
      ) : null}

      <JBAuthPrimaryButton
        className="mt-6"
        label={otpRequested ? "Validar código OTP" : "Solicitar código OTP"}
        loading={isLoading}
        disabled={
          !countryCode?.trim() ||
          !phone?.trim() ||
          (otpRequested && !code?.trim())
        }
        onPress={handleSubmit(onSubmitForm)}
      />

      {otpRequested ? (
        <JBAuthSecondaryButton
          className="mt-6"
          label="Cambiar teléfono"
          onPress={() => {
            setOtpRequested(false);
            setShouldSelectRoleOnVerify(false);
          }}
        />
      ) : null}

      {onBackToPassword ? (
        <JBAuthSecondaryButton
          label="Regresar a contraseña"
          onPress={onBackToPassword}
        />
      ) : null}
    </VStack>
  );
}
