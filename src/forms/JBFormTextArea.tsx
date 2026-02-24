// @ts-nocheck
import React from "react";
import { Controller } from "react-hook-form";
import type { TextInput } from "react-native";

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
import { Textarea, TextareaInput } from "../ui/textarea";
import { Box } from "../ui/box";
import { Text } from "../ui/text";

type CustomFormTextAreaProps = {
  control: any;
  fieldName: string;
  label?: string;
  placeholder?: string;
  className?: string;
  variant?: "underlined" | "outline" | "rounded";
  size?: "sm" | "md" | "lg";
  type?: "text" | "password" | undefined;
  defaultValue?: any;
  rules?: any;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  onChangeCustom?: any;
  helperText?: string;
  slotBefore?: any;
  slotAfter?: any;
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
  textareaClassName?: string;
  textareaInputClassName?: string;
};

export const CustomFormTextArea = ({
  control,
  fieldName,
  label = "",
  placeholder = "",
  variant = "underlined",
  className = "h-64",
  size = "lg",
  type = "text",
  helperText = undefined,
  defaultValue = undefined,
  isDisabled = false,
  isReadOnly = false,
  rules = {},
  onChangeCustom = null,
  slotBefore = null,
  slotAfter = null,
  autoCapitalize = "sentences",
  autoComplete = "off",
  autoCorrect = false,
  forceLowercase = false,
  capitalizeFirstLetter = false,
  returnKeyType = "done",
  inputRef,
  nextRef,
  onSubmitEditing,
  containerClassName = "",
  labelClassName = "",
  helperTextClassName = "",
  errorTextClassName = "",
  textareaClassName = "flex-1 px-3 border-0 bg-background-200 rounded-xl",
  textareaInputClassName = "",
  ...rest
}: CustomFormTextAreaProps) => {
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
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <FormControl
          isInvalid={error ? true : false}
          size={size}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={rules?.required ? true : false}
          className={`${className} ${containerClassName}`}
        >
          <FormControlLabel className="mb-3">
            <FormControlLabelText className={`text-white ${labelClassName}`}>
              {label}
            </FormControlLabelText>
          </FormControlLabel>

          {isDisabled ? (
            <Box className={`${textareaClassName}`}>
              <Text size="md" className="text-gray-400">
                {value}
              </Text>
            </Box>
          ) : (
            <Textarea {...rest} size={size} className={textareaClassName}>
              {slotBefore}
              <TextareaInput
                ref={inputRef}
                className={`flex-1 ${textareaInputClassName}`}
                type={type}
                placeholder={placeholder}
                value={value}
                maxLength={rules?.maxLength?.value}
                autoCapitalize={autoCapitalize}
                autoComplete={autoComplete}
                autoCorrect={autoCorrect}
                returnKeyType={returnKeyType}
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
              {slotAfter}
            </Textarea>
          )}

          {helperText && (
            <FormControlHelper>
              <FormControlHelperText className={helperTextClassName}>
                {helperText}
              </FormControlHelperText>
            </FormControlHelper>
          )}
          {error && (
            <FormControlError>
              <FormControlErrorIcon as={AlertCircleIcon} />
              <FormControlErrorText className={errorTextClassName}>
                {error.message || "Error"}
              </FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>
      )}
      name={fieldName}
      rules={rules}
      defaultValue={defaultValue}
    />
  );
};
