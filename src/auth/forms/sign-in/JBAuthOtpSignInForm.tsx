import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";
import { z } from "zod";

import { JBFormButton, JBFormInput, JBFormPicker, JBSelectOption } from "../../../forms";
import { ConfirmationDialog } from "../../../shared";
import { VStack } from "../../../ui";
import {
  COUNTRY_CALLING_CODE_OPTIONS,
  DEFAULT_OTP_COUNTRY_CODE,
} from "../../constants";
import { buildE164Phone, isValidE164Phone, resolveCountryCodeValue } from "../../utils";
import { parseAuthError } from "../errorParser";

export type JBAuthOtpSignInFormValues = {
  countryCode: JBSelectOption<string> | string;
  phone: string;
  code?: string;
};

export type JBAuthOtpSignInFormProps = {
  defaultValues?: Partial<JBAuthOtpSignInFormValues>;
  countryCodeOptions?: JBSelectOption<string>[];
  requestRoleSelection?: () => Promise<string | undefined>;
  loading?: boolean;
  showSubmitButton?: boolean;
  onFormStateChange?: (state: {
    submit: () => void;
    canSubmit: boolean;
    isLoading: boolean;
    submitLabel: string;
    otpRequested: boolean;
    resetPhoneStep: () => void;
  }) => void;
  onRequestOtp: (values: { phone: string }) => unknown | Promise<unknown>;
  onVerifyOtp: (values: {
    phone: string;
    code: string;
    role?: string;
  }) => unknown | Promise<unknown>;
  onBackToPassword?: () => void;
};

const otpSchema = z.object({
  countryCode: z
    .any()
    .refine(
      (value) => Boolean(resolveCountryCodeValue(value)?.trim()),
      "Selecciona la lada",
    ),
  phone: z.string().nonempty("Debes ingresar tu teléfono"),
  code: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^\d{6}$/.test(value.trim()),
      "El código OTP debe ser numérico de 6 dígitos"
    ),
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
    showSubmitButton = true,
    onFormStateChange,
    onRequestOtp,
    onVerifyOtp,
    onBackToPassword,
  } = props;

  const resolvedOptions = countryCodeOptions ?? COUNTRY_CALLING_CODE_OPTIONS;
  const fallbackCountryCode = resolvedOptions.some(
    (item) => item.value === DEFAULT_OTP_COUNTRY_CODE,
  )
    ? DEFAULT_OTP_COUNTRY_CODE
    : (resolvedOptions[0]?.value ?? DEFAULT_OTP_COUNTRY_CODE);
  const resolvedDefaultCountryCode = resolveCountryCodeValue(
    defaultValues?.countryCode,
  );
  const defaultCountryCode = resolvedOptions.find(
    (item) =>
      item.value ===
      (resolvedDefaultCountryCode || fallbackCountryCode),
  ) ?? {
    value: fallbackCountryCode,
    label: fallbackCountryCode,
  };

  const [otpRequested, setOtpRequested] = useState(false);
  const [shouldSelectRoleOnVerify, setShouldSelectRoleOnVerify] =
    useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingPhoneToConfirm, setPendingPhoneToConfirm] = useState<string | null>(null);

  const { control, formState, handleSubmit, setError, clearErrors, watch } =
    useForm<JBAuthOtpSignInFormValues>({
      mode: "onChange",
      defaultValues: {
        countryCode: defaultCountryCode,
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
  const selectedCountryCode = resolveCountryCodeValue(countryCode);
  const normalizedE164Phone = buildE164Phone(countryCode, phone);
  const isValidPhoneNumber = isValidE164Phone(normalizedE164Phone);
  const canSubmit =
    !!selectedCountryCode.trim() &&
    !!phone?.trim() &&
    isValidPhoneNumber &&
    (!otpRequested || !!code?.trim());
  const submitLabel = otpRequested ? "Validar código OTP" : "Solicitar código OTP";
  const resetPhoneStep = useCallback(() => {
    setOtpRequested(false);
    setShouldSelectRoleOnVerify(false);
  }, []);

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

  const requestOtpAfterConfirmation = useCallback(async (fullPhone: string) => {
    const response = await onRequestOtp({
      phone: fullPhone,
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
  }, [onRequestOtp, requestRoleSelection]);

  const onSubmitForm = useCallback(async (values: JBAuthOtpSignInFormValues) => {
    try {
      const fullPhone = buildE164Phone(values.countryCode, values.phone);
      if (!isValidE164Phone(fullPhone)) {
        setError("phone", {
          type: "manual",
          message:
            "Número no válido. Usa un número real con lada en formato internacional.",
        });
        return;
      }

      if (!otpRequested) {
        setPendingPhoneToConfirm(fullPhone);
        setConfirmDialogOpen(true);
        return;
      }

      if (!values.code?.trim()) {
        setError("code", {
          type: "manual",
          message: "Debes ingresar el código OTP",
        });
        return;
      }

      if (!/^\d{6}$/.test(values.code.trim())) {
        setError("code", {
          type: "manual",
          message: "El código OTP debe ser numérico de 6 dígitos",
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
        phone: fullPhone,
        code: values.code,
        role: selectedRole,
      });
    } catch (error) {
      applySubmitError(error);
    }
  }, [
    otpRequested,
    requestRoleSelection,
    onVerifyOtp,
    shouldSelectRoleOnVerify,
    requestOtpAfterConfirmation,
    setError,
  ]);
  const submitHandler = useCallback(() => {
    void handleSubmit(onSubmitForm)();
  }, [handleSubmit, onSubmitForm]);

  useEffect(() => {
    onFormStateChange?.({
      submit: submitHandler,
      canSubmit,
      isLoading,
      submitLabel,
      otpRequested,
      resetPhoneStep,
    });
  }, [onFormStateChange, submitHandler, canSubmit, isLoading, submitLabel, otpRequested, resetPhoneStep]);

  return (
    <>
      <ConfirmationDialog
        open={confirmDialogOpen}
        setOpen={setConfirmDialogOpen}
        showIcon={false}
        title="Confirmar número"
        content={
          pendingPhoneToConfirm
            ? `¿Este número es correcto?\n${pendingPhoneToConfirm}`
            : "¿Este número es correcto?"
        }
        agreeText="Enviar código"
        agreeColor="primary"
        disagreeText="Cambiar"
        disagreeColor="secondary"
        onAgree={() => {
          const fullPhone = pendingPhoneToConfirm;
          setConfirmDialogOpen(false);
          setPendingPhoneToConfirm(null);
          if (!fullPhone) return;
          void requestOtpAfterConfirmation(fullPhone).catch((error) => {
            applySubmitError(error);
          });
        }}
        onDisAgree={() => {
          setConfirmDialogOpen(false);
        }}
      />
      <VStack space="lg">
      <JBFormPicker
        control={control}
        fieldName="countryCode"
        label="Lada"
        items={resolvedOptions}
        valueField="iso2"
        sheetTitle="Selecciona la lada"
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

      {showSubmitButton ? (
        <JBFormButton
          className="mt-6"
          text={submitLabel}
          loading={isLoading}
          isDisabled={!canSubmit}
          onPress={submitHandler}
        />
      ) : null}

      {showSubmitButton && otpRequested ? (
        <JBFormButton
          variant="outline"
          action="primary"
          className="mt-6"
          text="Cambiar teléfono"
          onPress={resetPhoneStep}
        />
      ) : null}

      {onBackToPassword ? (
        <JBFormButton
          variant="link"
          action="primary"
          text="Regresar a contraseña"
          textClassName="text-sm font-semibold text-primary-600 dark:text-primary-300"
          onPress={onBackToPassword}
        />
      ) : null}
      </VStack>
    </>
  );
}
