// @ts-nocheck
import { Controller } from "react-hook-form";
import { Pressable, ScrollView } from "react-native";

import { Box } from "../ui/box";
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

type CustomFormColorSelectorProps = {
  control: any;
  fieldName: string;
  label?: string;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  defaultValue?: any;
  rules?: any;
  showLabel?: boolean;
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
  showLabel = true,
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
          {
            showLabel && (
              <FormControlLabel className="mb-6">
                <FormControlLabelText className={`text-white ${labelClassName}`}>
                  {label}
                </FormControlLabelText>
              </FormControlLabel>
            )
          }
          

          <Box className={pickerContainerClassName}>
            {/* <Box className="border border-gray-400 rounded-md p-2 pb-5"> */}
            {
              showPreview && (
                <Box
                  className={previewClassName}
                  style={{ backgroundColor: value }}/>
              )

            }
            

            {!isDisabled && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 4,
                  paddingRight: 6,
                }}
              >
                {materialPalette.map((color, index) => {
                  const isSelected = value?.toLowerCase?.() === color.toLowerCase();

                  return (
                    <Pressable
                      key={color}
                      onPress={() => {
                        if (onChangeCustom) {
                          onChangeCustom(color, onChange);
                        } else {
                          onChange(color);
                        }
                      }}
                      style={{
                        width: 25,
                        height: 25,
                        marginRight: index === materialPalette.length - 1 ? 0 : 10,
                        borderRadius: 12.5,
                        backgroundColor: color,
                        borderWidth: isSelected ? 3 : 1,
                        borderColor: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.25)",
                      }}
                    />
                  );
                })}
              </ScrollView>
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
