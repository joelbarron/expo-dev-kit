// @ts-nocheck
import { getColor } from "../utils/colors";
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
import { getLastCreatedJBExpoConfig, resolveJBUIColor } from "../config";
import { useColorScheme } from "../hooks";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";
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
  minimumDate?: Date;
  maximumDate?: Date;
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
  minimumDate,
  maximumDate,
}: CustomFormDateTimePickerProps) => {
  const colorScheme = useColorScheme();
  const primaryColor = getColor("primary") ?? {};
  const backgroundColor = getColor("background") ?? {};
  const typography = getColor("typography") ?? {};
  const baseConfig = getLastCreatedJBExpoConfig();
  const resolvedFormBackgroundColor = resolveJBUIColor(
    baseConfig?.ui?.forms?.backgroundColor,
    colorScheme,
    colorScheme === "dark"
      ? backgroundColor[200] ?? "#121b26"
      : backgroundColor[50] ?? "#ffffff",
  );
  const resolvedBottomSheetBackgroundColor = resolveJBUIColor(
    baseConfig?.ui?.forms?.bottomSheetBackgroundColor,
    colorScheme,
    colorScheme === "dark"
      ? backgroundColor[950] ?? "#121b26"
      : backgroundColor[50] ?? "#ffffff",
  );
  const defaultLightTextColor =
    typography.black ?? typography[900] ?? "#0f172a";
  const defaultDarkTextColor =
    typography.white ?? typography[50] ?? "#f8fafc";
  const resolvedFormTextColor = resolveJBUIColor(
    baseConfig?.ui?.forms?.textColor,
    colorScheme,
    colorScheme === "dark" ? defaultDarkTextColor : defaultLightTextColor,
  );
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
            <FormControlLabelText
              className={labelClassName}
              style={{ color: resolvedFormTextColor }}
            >
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
            <HStack
              className="h-16 rounded-xl items-center justify-between px-3"
              style={{ backgroundColor: resolvedFormBackgroundColor }}
            >
                <Text
                  size="md"
                  className={value ? "" : "text-gray-400"}
                  style={value ? { color: resolvedFormTextColor } : undefined}
                >
                  {value
                    ? showTime
                      ? getFormattedDateTime(value)
                      : getFormattedDateTimeExtended(value)
                    : "Seleccionar fecha"}
                </Text>
              <Icon
                as={CalendarDaysIcon}
                size="md"
                className="text-gray-300"
                color={resolvedFormTextColor}
              />
            </HStack>
          </TouchableOpacity>

          <BottomSheetModal
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enableOverDrag={false}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: resolvedBottomSheetBackgroundColor }}
          >
            <Box className="px-4 pt-2 pb-4">
              {value ? (
                <Box className="w-full items-center justify-center">
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
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
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
                </Box>
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
    alignSelf: "center",
    height: "100%",
  },
});
