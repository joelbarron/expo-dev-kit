// @ts-nocheck
import React from "react";
import { Controller } from "react-hook-form";

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
import { AlertCircleIcon, CircleIcon } from "../ui/icon";
import { HStack } from "../ui/hstack";
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from "../ui/radio";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";

type CustomFormRadioGroupProps = {
  control: any;
  items?: any[];
  fieldName: string;
  variant?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  defaultValue?: any;
  rules?: any;
  showPreview?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  onChangeCustom?: any;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
  helperTextClassName?: string;
  errorTextClassName?: string;
  radioGroupClassName?: string;
  radioItemClassName?: string;
  radioLabelClassName?: string;
};

export const CustomFormRadioGroup = ({
  control,
  items = [],
  fieldName,
  variant = "stacked",
  label = "",
  placeholder = "",
  className = "",
  size = "lg",
  helperText = undefined,
  defaultValue = undefined,
  isDisabled = false,
  isReadOnly = false,
  showPreview = true,
  rules = {},
  onChangeCustom = null,
  containerClassName = "",
  labelClassName = "",
  helperTextClassName = "",
  errorTextClassName = "",
  radioGroupClassName = "",
  radioItemClassName = "",
  radioLabelClassName = "",
  ...rest
}: CustomFormRadioGroupProps) => {
  const renderItems = () => (
    <>
      {items.map((item) => (
        <Radio
          key={item.value}
          value={item.value}
          size="lg"
          className={radioItemClassName}
        >
          <RadioIndicator>
            <RadioIcon as={CircleIcon} />
          </RadioIndicator>
          <RadioLabel className={radioLabelClassName}>
            {item.label}
          </RadioLabel>
        </Radio>
      ))}
    </>
  );

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
          <FormControlLabel className="mb-6">
            <FormControlLabelText className={`text-white ${labelClassName}`}>
              {label}
            </FormControlLabelText>
          </FormControlLabel>

          <VStack space="sm">
            <RadioGroup
              value={value}
              onChange={(val) => {
                // console.log("val", val);
                if (onChangeCustom) {
                  onChangeCustom(val, onChange);
                } else {
                  onChange(val);
                }
              }}
              className={radioGroupClassName}
            >
              {variant === "inline" ? (
                <HStack space="2xl">{renderItems()}</HStack>
              ) : (
                <VStack space="md">{renderItems()}</VStack>
              )}
            </RadioGroup>
            {placeholder && !isDisabled && (
              <Text className="mt-3 text-sm text-primary-500">
                {placeholder}
              </Text>
            )}
          </VStack>

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
