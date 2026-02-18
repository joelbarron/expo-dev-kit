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
import { AlertCircleIcon } from "../ui/icon";
import { materialPalette } from "../utils/colors";
import ColorPicker from "react-native-wheel-color-picker";
import { Box } from "../ui/box";

type CustomFormColorSelectorProps = {
  control: any;
  fieldName: string;
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
  previewClassName?: string;
  pickerContainerClassName?: string;
};

export const CustomFormColorSelector = ({
  control,
  fieldName,
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
  previewClassName = "w-full max-w-[200px] h-[40px] rounded-xl mb-6",
  pickerContainerClassName = "rounded-md p-2 pb-5",
  ...rest
}: CustomFormColorSelectorProps) => {
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

          <Box className={pickerContainerClassName}>
            {/* <Box className="border border-gray-400 rounded-md p-2 pb-5"> */}
            <Box
              className={previewClassName}
              style={{ backgroundColor: value }}
            ></Box>

            {!isDisabled && (
              <ColorPicker
                color={value}
                swatchesOnly={true}
                onColorChangeComplete={(color) => {
                  // console.log("color", color);
                  if (onChangeCustom) {
                    onChangeCustom(color, onChange);
                  } else {
                    onChange(color);
                  }
                }}
                thumbSize={30}
                sliderSize={20}
                noSnap={true}
                row={false}
                swatchesLast={true}
                swatches={true}
                discrete={false}
                gapSize={5}
                palette={materialPalette}
              />
            )}
          </Box>

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
