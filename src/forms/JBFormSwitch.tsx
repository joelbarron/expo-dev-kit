// @ts-nocheck
import { getColor } from "../utils/colors";
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
import { Switch } from "../ui/switch";

export const CustomFormSwitch = ({
  control,
  fieldName,
  label = "",
  size = "lg",
  labelCheck = true,
  helperText = undefined,
  defaultValue = false,
  defaultIsChecked = false,
  rules = {},
  isDisabled = false,
  isReadOnly = false,
  onChangeCustom = null,
  mt = "",
  mbl = "",
  containerClassName = "",
  labelClassName = "",
  helperTextClassName = "",
  errorTextClassName = "",
  trackColor = undefined,
  thumbColor = undefined,
  iosBackgroundColor = undefined,
  ...rest
}: any) => {
  const grayColor = getColor("gray");
  const primaryColor = getColor("primary");

  return (
    <Controller
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }: any) => (
        <FormControl
          isInvalid={error ? true : false}
          size={size}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={rules?.required ? true : false}
          className={containerClassName}
        >
          <FormControlLabel className="mb-3">
            <FormControlLabelText className={`text-white ${labelClassName}`}>
              {label}
            </FormControlLabelText>
          </FormControlLabel>

          <Switch
            value={value}
            defaultValue={defaultValue}
            trackColor={
              trackColor ?? {
                false: grayColor[300],
                true: primaryColor[500],
              }
            }
            thumbColor={thumbColor ?? grayColor[50]}
            activeThumbColor={thumbColor ?? grayColor[50]}
            ios_backgroundColor={iosBackgroundColor ?? primaryColor[300]}
            onToggle={(val) => {
              // console.log(val);
              if (onChangeCustom) {
                onChangeCustom(val, onChange);
              }
              onChange(val);
            }}
          />

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
