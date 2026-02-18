// @ts-nocheck
import { getColor } from "../utils/colors";
import { getColorScheme } from "../utils/config";
import { FontAwesome } from "@expo/vector-icons";
import { Controller } from "react-hook-form";
import { StyleSheet } from "react-native";
import { MultiSelect } from "react-native-element-dropdown";
import { Chip } from "../shared/Chip";
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

const primaryColor = getColor("primary");
const grayColor = getColor("gray");
const colorScheme = getColorScheme();

export const CustomFormMultiSelect = ({
  control,
  items = [],
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
  defaultValue = [],
  onBlurCustom = null,
  rightContent = null,
  containerClassName = "",
  labelClassName = "",
  helperTextClassName = "",
  errorTextClassName = "",
  dropdownStyle = undefined,
  dropdownDisabledStyle = undefined,
  placeholderStyle = undefined,
  placeholderStyleDisabled = undefined,
  inputSearchStyle = undefined,
  iconStyle = undefined,
  containerStyle = undefined,
  itemContainerStyle = undefined,
}: any) => {
  /**
   * renderMultiSelect
   */
  const _renderMultiSelect = ({ onChange, value }: any) => (
    <MultiSelect
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
      // selectedTextStyle={styles.selectedTextStyle}
      inputSearchStyle={inputSearchStyle ?? styles.inputSearchStyle}
      iconStyle={iconStyle ?? styles.iconStyle}
      containerStyle={containerStyle ?? styles.container}
      // selectedStyle={styles.selectedStyle}
      itemContainerStyle={itemContainerStyle ?? styles.itemContainerStyle}
      data={items}
      maxHeight={300}
      disable={isDisabled}
      labelField={labelField}
      valueField={valueField}
      activeColor={primaryColor[500]}
      placeholder="Seleccionar elementos"
      searchPlaceholder="Buscar..."
      value={value}
      onChange={(item) => {
        if (onChangeCustom) {
          onChangeCustom(item, onChange);
        } else {
          onChange(item);
        }
      }}
      onBlur={() => {
        if (onBlurCustom) {
          onBlurCustom();
        }
      }}
      renderSelectedItem={(item: any, unSelect) => (
        <Chip
          pressable={!isDisabled}
          className="mt-4 mr-4 px-4 h-[30px]"
          title={item.label}
          titleClassName="text-white"
          isActive={!isDisabled}
          icon={
            !isDisabled && <FontAwesome name="trash" color="white" size={20} />
          }
          onPress={() => unSelect && unSelect(item)}
        />
      )}
    />
  );
  return (
    <Controller
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
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

          <Box className="flex-row ">
            <Box className="w-[85%]">
              {_renderMultiSelect({ onChange, value })}
            </Box>
            <Box className="w-[15%] items-center">{rightContent}</Box>
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

const styles = StyleSheet.create({
  container: {},
  dropdown: {
    height: 50,
    backgroundColor: "transparent",
    borderColor: "white",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
  },
  dropdownDisabled: {
    height: 50,
    backgroundColor: "transparent",
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
    color: colorScheme === "dark" ? grayColor[400] : "black",
  },
  placeholderStyleDisabled: {
    color: "grey",
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  selectedStyle: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  itemContainerStyle: {
    // backgroundColor: "green",
    padding: 5,
  },
});
