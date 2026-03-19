// @ts-nocheck
import React from "react";
import { Controller } from "react-hook-form";
import type { TextInput } from "react-native";

import { getLastCreatedJBExpoConfig, resolveJBUIColor } from "../config";
import { useColorScheme } from "../hooks";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "../ui/form-control";
import { AlertCircleIcon } from "../ui/icon";
import { Input, InputField } from "../ui/input";
import { Text } from "../ui/text";
import { getColor } from "../utils";

type CustomFormInputProps = {
  control: any;
  fieldName: string;
  label?: string;
  placeholder?: string;
  variant?: "underlined" | "outline" | "rounded";
  size?: "sm" | "md" | "lg";
  type?: "text" | "password" | undefined;
  secureTextEntry?: boolean;
  defaultValue?: any;
  rules?: any;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  onChangeCustom?: any;
  helperText?: string;
  slotBefore?: any;
  slotAfter?: any;
  keyboardType?: any;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: string;
  autoCorrect?: boolean;
  forceLowercase?: boolean;
  capitalizeFirstLetter?: boolean;
  returnKeyType?: "done" | "next" | "go" | "search" | "send";
  inputRef?: React.RefObject<TextInput>;
  nextRef?: React.RefObject<TextInput>;
  onSubmitEditing?: () => void;
  containerClassName?: string;
  labelClassName?: string;
  helperTextClassName?: string;
  errorTextClassName?: string;
  inputClassName?: string;
  inputFieldClassName?: string;
};

export const CustomFormInput = ({
  control,
  fieldName,
  label = "",
  placeholder = "",
  variant = "outline",
  size = "lg",
  type = "text",
  secureTextEntry = false,
  helperText = undefined,
  defaultValue = undefined,
  isDisabled = false,
  isReadOnly = false,
  rules = {},
  onChangeCustom = null,
  slotBefore = null,
  slotAfter = null,
  keyboardType = null,
  autoCapitalize = "sentences",
  autoComplete = "off",
  autoCorrect = false,
  forceLowercase = false,
  capitalizeFirstLetter = false,
  returnKeyType = "done",
  inputRef,
  nextRef,
  onSubmitEditing,
  containerClassName = "mb-4",
  labelClassName = "",
  helperTextClassName = "",
  errorTextClassName = "",
  inputClassName = "h-16 border-0 bg-background-200 rounded-xl",
  inputFieldClassName = "",
  ...rest
}: CustomFormInputProps) => {
  const scheme = useColorScheme();
  const baseConfig = getLastCreatedJBExpoConfig();
  const background = getColor("background") ?? {};
  const typography = getColor("typography") ?? {};
  const redColor = getColor("red") ?? {};
  const resolvedErrorColor =
    scheme === "dark" ? redColor[500] ?? "#ef4444" : redColor[600] ?? "#dc2626";
  const resolvedInputBackgroundColor = resolveJBUIColor(
    baseConfig?.ui?.forms?.backgroundColor,
    scheme,
    scheme === "dark" ? background[200] ?? "#121b26" : background[50] ?? "#ffffff",
  );
  const defaultLightTextColor =
    typography.black ?? typography[900] ?? "#0f172a";
  const defaultDarkTextColor =
    typography.white ?? typography[50] ?? "#f8fafc";
  const resolvedInputTextColor = resolveJBUIColor(
    baseConfig?.ui?.forms?.textColor,
    scheme,
    scheme === "dark" ? defaultDarkTextColor : defaultLightTextColor,
  );
  const resolvedInputPlaceholderColor =
    scheme === "dark" ? typography[400] ?? "#94a3b8" : typography[500] ?? "#64748b";

  const normalizeText = (val: string) => {
    let next = val ?? "";
    if (forceLowercase) next = next.toLowerCase();
    if (capitalizeFirstLetter && next.length > 0) {
      next = next.charAt(0).toUpperCase() + next.slice(1);
    }
    return next;
  };

  return (
    <Controller
      control={control}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) =>
        (() => {
          const isNonInteractive = isDisabled || isReadOnly;
          const displayValue =
            typeof value === "string" ? value.replace(/\r?\n/g, " ") : value;
          const maskedDisplayValue =
            typeof displayValue === "string" && secureTextEntry
              ? "•".repeat(displayValue.length)
              : displayValue;
          return (
            <FormControl
              isInvalid={error ? true : false}
              size={size}
              isDisabled={isDisabled}
              isReadOnly={isReadOnly}
              isRequired={rules?.required ? true : false}
              className={containerClassName}
            >
              <FormControlLabel className="mb-3">
                <FormControlLabelText
                  className={labelClassName}
                  style={{ color: resolvedInputTextColor }}
                >
                  {label}
                </FormControlLabelText>
              </FormControlLabel>

              <Input
                variant={variant}
                size="xl"
                className={inputClassName}
                style={{ backgroundColor: resolvedInputBackgroundColor }}
              >
                {slotBefore}
                {isNonInteractive ? (
                  <Text
                    className={`px-3 ${inputFieldClassName}`}
                    style={{ color: resolvedInputTextColor }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {maskedDisplayValue ?? ""}
                  </Text>
                ) : (
                  <InputField
                    {...rest}
                    ref={inputRef}
                    className={inputFieldClassName}
                    type={type}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    placeholder={placeholder}
                    placeholderTextColor={resolvedInputPlaceholderColor}
                    value={value}
                    style={{ color: resolvedInputTextColor }}
                    multiline={false}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    maxLength={rules?.maxLength?.value}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                    autoCorrect={autoCorrect}
                    returnKeyType={returnKeyType}
                    onBlur={onBlur}
                    onSubmitEditing={() => {
                      if (onSubmitEditing) {
                        onSubmitEditing();
                      } else if (nextRef?.current?.focus) {
                        nextRef.current.focus();
                      }
                    }}
                    onChangeText={(val) => {
                      const next = normalizeText(val);
                      if (onChangeCustom) {
                        onChangeCustom(next, onChange);
                      } else {
                        onChange(next);
                      }
                    }}
                  />
                )}
                {isNonInteractive ? null : slotAfter}
              </Input>

              {helperText && (
                <FormControlHelper>
                  <FormControlHelperText className={helperTextClassName}>
                    {helperText}
                  </FormControlHelperText>
                </FormControlHelper>
              )}
              {error && (
                <FormControlError>
                  <FormControlErrorIcon
                    as={AlertCircleIcon}
                    size="sm"
                    className="mt-2"
                    color={resolvedErrorColor}
                  />
                  <FormControlErrorText
                    className={`ml-2 mt-2 text-md leading-5 ${errorTextClassName}`}
                    style={{ color: resolvedErrorColor }}
                  >
                    {error.message || "Error"}
                  </FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>
          );
        })()
      }
      name={fieldName}
      rules={rules}
      defaultValue={defaultValue}
    />
  );
};
