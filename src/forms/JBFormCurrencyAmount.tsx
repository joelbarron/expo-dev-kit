// @ts-nocheck
import React, { useState } from "react";
import { Controller } from "react-hook-form";
import { Platform } from "react-native";

import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "../ui/form-control";
import { AlertCircleIcon } from "../ui/icon";
import { HStack } from "../ui/hstack";
import { Input, InputField } from "../ui/input";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";

type TransactionMode = "EXPENSE" | "INCOME";

type Props = {
  control: any;
  fieldName: string;
  mode: TransactionMode;
  currency?: string;
  rules?: any;
  isDisabled?: boolean;
  label?: string;
  autoFocus?: boolean;
  locale?: string;
};

const sanitizeAmount = (value: string) => {
  let next = (value ?? "").replace(/,/g, ".").replace(/[^\d.]/g, "");
  const firstDot = next.indexOf(".");
  if (firstDot !== -1) {
    next =
      next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, "");
  }
  if (next.startsWith(".")) next = `0${next}`;
  return next;
};

export function CustomFormCurrencyAmount({
  control,
  fieldName,
  mode,
  currency = "MXN",
  rules = {},
  isDisabled = false,
  label = "Cantidad",
  autoFocus = true,
  locale = "es-MX",
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const amountColor = mode === "INCOME" ? "#22C55E" : "#F43F5E";
  const sign = mode === "INCOME" ? "+" : "-";

  return (
    <Controller
      control={control}
      name={fieldName}
      rules={rules}
      defaultValue=""
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
        const rawValue = value ?? "";
        const formattedValue =
          rawValue === "" || rawValue === null || rawValue === undefined
            ? "0"
            : Number.isFinite(Number(rawValue))
              ? Number(rawValue).toLocaleString(locale, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })
              : String(rawValue);

        return (
        <FormControl isInvalid={!!error} isDisabled={isDisabled} isRequired>
          <FormControlLabel className="mb-3">
            <FormControlLabelText className="text-white">{label}</FormControlLabelText>
          </FormControlLabel>

          <VStack className="rounded-2xl bg-background-200 p-4" space="md">
            <HStack className="justify-start">
              <HStack className="rounded-full bg-background-400 px-3 py-1.5">
                <Text size="sm" className="font-semibold">
                  {currency}
                </Text>
              </HStack>
            </HStack>

            <HStack className="items-end justify-end" space="sm">
              <Text
                style={{ color: amountColor, fontSize: 48, lineHeight: 52, fontWeight: "700" }}
              >
                {sign}
              </Text>
              {isDisabled ? (
                <Text
                  style={{ color: amountColor, fontSize: 48, lineHeight: 52, fontWeight: "700" }}
                >
                  {formattedValue}
                </Text>
              ) : (
                <Input variant="outline" size="xl" className="min-w-[110px] border-0 bg-transparent">
                  <InputField
                    value={isFocused ? String(rawValue) : formattedValue}
                    onBlur={() => {
                      setIsFocused(false);
                      onBlur();
                    }}
                    onFocus={() => setIsFocused(true)}
                    onChangeText={(text) => onChange(sanitizeAmount(text))}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType={Platform.OS === "android" ? "numeric" : "decimal-pad"}
                    autoFocus={autoFocus && !isDisabled}
                    className="text-right py-0"
                    style={{
                      color: amountColor,
                      fontSize: 48,
                      lineHeight: 52,
                      fontWeight: "700",
                    }}
                  />
                </Input>
              )}
            </HStack>
          </VStack>

          {error ? (
            <FormControlError className="mt-2">
              <FormControlErrorIcon as={AlertCircleIcon} />
              <FormControlErrorText>{error.message || "Error"}</FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>
        );
      }}
    />
  );
}
