// @ts-nocheck
import { Controller } from "react-hook-form";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from "../ui/checkbox";
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
import { AlertCircleIcon, CheckIcon } from "../ui/icon";

export const CustomFormCheckbox = ({
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
  checkboxLabelClassName = "",
  ...rest
}: any) => {
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
          <FormControlLabel className="">
            <FormControlLabelText className={`text-white ${labelClassName}`}>
              {label}
            </FormControlLabelText>
          </FormControlLabel>

          {/* <Checkbox
            value={value}
            colorScheme="primary"
            defaultIsChecked={defaultIsChecked}
            isDisabled={isDisabled}
            onChange={(val) => {
              if (onChangeCustom) {
                onChangeCustom(val, onChange);
              }
              onChange(val);
            }}
          >
            {labelCheck ? label : ""}
          </Checkbox> */}

          <Checkbox
            size="md"
            isDisabled={isDisabled}
            isInvalid={error ? true : false}
            value={fieldName}
            isChecked={Boolean(value)}
            onChange={(val) => {
              const checked = Boolean(val);
              if (onChangeCustom) {
                onChangeCustom(checked, onChange);
              }
              onChange(checked);
            }}
          >
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel className={checkboxLabelClassName}>
              {label}
            </CheckboxLabel>
          </Checkbox>

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
