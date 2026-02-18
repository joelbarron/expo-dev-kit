// @ts-nocheck
import { getColor } from "../utils/colors";
import { getColorScheme } from "../utils/config";
import React from "react";
import { Controller } from "react-hook-form";
import { StyleSheet } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
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

const grayColor = getColor("gray");
const primaryColor = getColor("primary");
const colorScheme = getColorScheme();

type CustomFormSelectProps = {
  control: any;
  items?: any[];
  options?: any[];
  fieldName: string;
  label: string;
  helperText?: string;
  rules?: any;
  size?: "sm" | "md" | "lg";
  search?: boolean;
  labelField?: string;
  valueField?: string;
  onChangeCustom?: any;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  defaultValue?: any;
  containerStyle?: any;
  rightContent?: any;
  containerClassName?: string;
  labelClassName?: string;
  helperTextClassName?: string;
  errorTextClassName?: string;
  dropdownStyle?: any;
  dropdownDisabledStyle?: any;
  placeholderStyle?: any;
  placeholderStyleDisabled?: any;
  selectedTextStyle?: any;
  inputSearchStyle?: any;
  iconStyle?: any;
  itemTextStyle?: any;
  labelStyle?: any;
};

export const CustomFormSelect = ({
  control,
  items = [],
  options = [],
  fieldName,
  label,
  rules = {},
  size = "lg",
  helperText = undefined,
  search = false,
  labelField = "label",
  valueField = "value",
  onChangeCustom = null,
  isDisabled = false,
  isReadOnly = false,
  defaultValue = undefined,
  containerStyle = undefined,
  rightContent = null,
  containerClassName = "",
  labelClassName = "",
  helperTextClassName = "",
  errorTextClassName = "",
  dropdownStyle = undefined,
  dropdownDisabledStyle = undefined,
  placeholderStyle = undefined,
  placeholderStyleDisabled = undefined,
  selectedTextStyle = undefined,
  inputSearchStyle = undefined,
  iconStyle = undefined,
  itemTextStyle = undefined,
  labelStyle = undefined,
}: CustomFormSelectProps) => {
  const resolvedItems = options?.length ? options : items;
  /**
   * renderDropdown
   */
  const _renderDropdown = ({ onChange, onBlur, value }: any) => (
    <Dropdown
      mode="default"
      search={search}
      style={
        isDisabled
          ? dropdownDisabledStyle ?? styles.dropdownDisabled
          : dropdownStyle ?? styles.dropdown
      }
      placeholderStyle={
        isDisabled
          ? placeholderStyleDisabled ?? styles.placeholderStyleDisabled
          : placeholderStyle ?? styles.placeholderStyle
      }
      onBlur={onBlur}
      selectedTextStyle={selectedTextStyle ?? styles.selectedTextStyle}
      inputSearchStyle={inputSearchStyle ?? styles.inputSearchStyle}
      iconStyle={iconStyle ?? styles.iconStyle}
      data={resolvedItems}
      maxHeight={300}
      disable={isDisabled}
      labelField={labelField}
      valueField={valueField}
      activeColor={primaryColor[500]}
      // selectedTextProps=}
      itemTextStyle={itemTextStyle ?? styles.itemTextStyle}
      labelStyle={labelStyle ?? styles.itemTextStyle}
      placeholder="Seleccionar elemento"
      searchPlaceholder="Buscar..."
      value={value}
      onChange={(item) => {
        if (onChangeCustom) {
          onChangeCustom(item, onChange);
        } else {
          onChange(item[valueField]);
        }
      }}
    />
  );

  /**
   * render
   */
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
          className={containerClassName}
        >
          <FormControlLabel className="mb-3">
            <FormControlLabelText className={`text-white ${labelClassName}`}>
              {label}
            </FormControlLabelText>
          </FormControlLabel>

            {rightContent ? (
              <Box className="flex-row" style={containerStyle}>
                <Box className="w-[85%]">
                  {_renderDropdown({ onChange, onBlur, value })}
                </Box>
                <Box className="w-[15%] items-center justify-center">
                  {rightContent}
                </Box>
              </Box>
            ) : (
              <Box style={containerStyle}>
                {_renderDropdown({ onChange, onBlur, value })}
              </Box>
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

const styles = StyleSheet.create({
  container: {},
  dropdown: {
    height: 50,
    borderColor: "white",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
  },
  dropdownDisabled: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  itemTextStyle: {
    backgroundColor: "transparent",
    color: "black",
  },
  label: {
    position: "absolute",
    // backgroundColor: "red",
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
    color: colorScheme === "dark" ? grayColor[400] : "black",
  },
  placeholderStyleDisabled: {
    color: "grey",
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: colorScheme === "dark" ? grayColor[400] : "black",
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});
