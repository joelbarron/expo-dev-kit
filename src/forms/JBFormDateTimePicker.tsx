// @ts-nocheck
import { getColor } from "../utils/colors";
import { getColorScheme } from "../utils/config";
import {
  getFormattedDateTime,
  getFormattedDateTimeExtended,
} from "../utils/data-format";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import RNDateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useCallback, useMemo, useRef } from "react";
import { Controller } from "react-hook-form";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { Box } from "../ui/box";
import { Button, ButtonIcon, ButtonText } from "../ui/button";
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
import { HStack } from "../ui/hstack";
import { AlertCircleIcon, CalendarDaysIcon, Icon } from "../ui/icon";
import { Text } from "../ui/text";

const colorScheme = getColorScheme();
const primaryColor = getColor("primary");
const backgroundColor = getColor("background");

type CustomFormDateTimePickerProps = {
  className?: string;
  mode?: "date" | "time" | "datetime";
  control: any;
  fieldName: string;
  label: string;
  helperText?: string;
  size?: "sm" | "md" | "lg" | undefined;
  rules?: any;
  onChangeCustom?: any;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  defaultValue?: Date;
  containerClassName?: string;
  labelClassName?: string;
  helperTextClassName?: string;
  errorTextClassName?: string;
  buttonClassName?: string;
  buttonTextClassName?: string;
  buttonIconClassName?: string;
  dateTextClassName?: string;
  closeOnSelect?: boolean;
  showTime?: boolean;
};

export const CustomFormDateTimePicker = ({
  className = "",
  mode = "date",
  control,
  fieldName,
  helperText = undefined,
  size = "lg",
  label = "",
  rules = {},
  onChangeCustom = null,
  isDisabled = false,
  isReadOnly = false,
  defaultValue = new Date(),
  containerClassName = "",
  labelClassName = "",
  helperTextClassName = "",
  errorTextClassName = "",
  buttonClassName = "",
  buttonTextClassName = "text-gray-400",
  buttonIconClassName = "text-gray-400",
  dateTextClassName = "ml-3 mt-4font-medium text-gray-600",
  closeOnSelect = true,
  showTime = false,
}: CustomFormDateTimePickerProps) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["42%"], []);

  const openPicker = useCallback(() => {
    if (isDisabled) return;
    bottomSheetRef.current?.present();
  }, [isDisabled]);

  const closePicker = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    [],
  );

  const pickerMode =
    mode === "datetime" ? (showTime ? "datetime" : "date") : mode;

  return (
    <Controller
      control={control}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <FormControl
          className={`w-full ${className} ${containerClassName}`}
          isInvalid={error ? true : false}
          size={size}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={rules?.required ? true : false}
        >
          <FormControlLabel className="mb-3">
            <FormControlLabelText className={`text-white ${labelClassName}`}>
              {label}
            </FormControlLabelText>
          </FormControlLabel>

          <TouchableOpacity
            disabled={isDisabled}
            onPress={() => {
              if (!value) {
                onChange(new Date());
              }
              openPicker();
            }}
          >
            <HStack className="h-16 rounded-xl bg-background-200 items-center justify-between px-3">
                <Text
                  size="md"
                  className={value ? "text-white" : "text-gray-400"}
                >
                  {value
                    ? showTime
                      ? getFormattedDateTime(value)
                      : getFormattedDateTimeExtended(value)
                    : "Seleccionar fecha"}
                </Text>
              <Icon as={CalendarDaysIcon} size="md" className="text-gray-300" />
            </HStack>
          </TouchableOpacity>

          <BottomSheetModal
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enableOverDrag={false}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: backgroundColor[950] }}
          >
            <Box className="px-4 pt-2 pb-4">
              {value ? (
                <RNDateTimePicker
                  themeVariant={colorScheme}
                  textColor={primaryColor[500]}
                  accentColor={primaryColor[500]}
                  disabled={isDisabled}
                  style={styles.date}
                  mode={pickerMode}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  locale="es-MX"
                  value={value}
                  onChange={(event: DateTimePickerEvent, date?: Date) => {
                    const eventType = event?.type;
                    if (eventType === "dismissed" || !date) return;
                    if (onChangeCustom) {
                      onChangeCustom(date, onChange);
                    } else {
                      onChange(date);
                    }
                    if (Platform.OS === "android" && closeOnSelect) {
                      closePicker();
                    }
                  }}
                  onError={(e) => console.log(e)}
                />
              ) : null}

              <Button
                className="mt-3"
                variant="solid"
                action="primary"
                onPress={closePicker}
              >
                <ButtonText>Listo</ButtonText>
              </Button>
            </Box>
          </BottomSheetModal>
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
  date: {
    width: "100%",
    height: "100%",
    // backgroundColor: "red",
  },
});
