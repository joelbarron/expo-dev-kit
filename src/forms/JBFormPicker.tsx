// @ts-nocheck
import { getColor } from "../utils/colors";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef } from "react";
import { Controller } from "react-hook-form";
import { TouchableOpacity as RNTouchableOpacity } from "react-native";
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
import { HStack } from "../ui/hstack";
import { AlertCircleIcon, ChevronDownIcon, Icon } from "../ui/icon";
import { Text } from "../ui/text";

const backgroundColor = getColor("background");
const TouchableOpacity: any = RNTouchableOpacity;

type CustomFormPickerProps = {
  control: any;
  items?: any[];
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
  manageLabel?: string;
  managePath?: string;
  onManagePress?: () => void;
  onRefreshItems?: any;
  renderItem?: (
    item: any,
    index: number,
    meta?: { isSelected: boolean; value: any },
  ) => React.ReactNode;
  snapPoints?: string[];
  sheetBackgroundColor?: string;
  sheetTitle?: string;
  sheetContentClassName?: string;
  listContentClassName?: string;
  triggerClassName?: string;
  triggerBackgroundClassName?: string;
  triggerTextClassName?: string;
  iconClassName?: string;
  optionContainerClassName?: string;
  optionClassName?: string;
  optionSelectedClassName?: string;
  optionTextClassName?: string;
  renderTrigger?: (args: {
    value: any;
    open: () => void;
    disabled: boolean;
  }) => React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  helperTextClassName?: string;
  errorTextClassName?: string;
};

export const CustomFormPicker = ({
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
  defaultValue = null,
  containerStyle = undefined,
  rightContent = null,
  manageLabel = undefined,
  managePath = undefined,
  onManagePress = undefined,
  onRefreshItems = () => {},
  renderItem = null,
  snapPoints = ["40%", "65%", "90%"],
  sheetBackgroundColor = backgroundColor[950],
  sheetTitle = "",
  sheetContentClassName = "pt-5",
  listContentClassName = "pb-24",
  triggerClassName = "h-16 rounded-xl items-center justify-between px-3",
  triggerBackgroundClassName = "bg-background-200",
  triggerTextClassName = "",
  iconClassName = "text-white mr-1",
  optionContainerClassName = "w-full justify-center items-center",
  optionClassName = "mb-3 rounded-xl w-[90%] self-center bg-background-200 px-4 py-4",
  optionSelectedClassName = "bg-primary-500",
  optionTextClassName = "p-2 text-white",
  renderTrigger,
  containerClassName = "",
  labelClassName = "",
  helperTextClassName = "",
  errorTextClassName = "",
}: CustomFormPickerProps) => {
  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const shouldReopenOnFocusRef = useRef(false);
  const computedSnapPoints = useMemo(() => snapPoints, [snapPoints]);
  const router = useRouter();
  const primaryColor = getColor("primary");

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  // changes
  const handleSheetChanges = useCallback((index: number) => {
    // console.log("handleSheetChanges", index);
  }, []);

  const hasManageAction = Boolean(manageLabel && (managePath || onManagePress));

  const handleManagePress = useCallback(() => {
    shouldReopenOnFocusRef.current = true;
    bottomSheetModalRef.current?.dismiss();
    if (onManagePress) {
      onManagePress();
      return;
    }
    if (managePath) {
      router.push(managePath as any);
    }
  }, [managePath, onManagePress, router]);

  useFocusEffect(
    useCallback(() => {
      if (!shouldReopenOnFocusRef.current) return;
      shouldReopenOnFocusRef.current = false;

      Promise.resolve(onRefreshItems?.())
        .catch(() => {
          // ignore refresh errors and still reopen
        })
        .finally(() => {
          requestAnimationFrame(() => {
            bottomSheetModalRef.current?.present();
          });
        });
    }, [onRefreshItems]),
  );

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

  /**
   * renderOption
   */
  const renderOption = (item, index, value, onChange) => {
    const itemValue = item?.[valueField];
    const itemLabel = item?.[labelField];
    const selectedValue = value?.[valueField] ?? value?.value;
    const isSelected = selectedValue === itemValue;
    return (
      <Box className={optionContainerClassName}>
        <TouchableOpacity
          onPress={() => {
            if (onChangeCustom) {
              onChangeCustom(item, onChange);
            } else {
              onChange(item);
            }
            bottomSheetModalRef.current?.dismiss();
          }}
          className={`${optionClassName} ${
            isSelected ? optionSelectedClassName : ""
          }`}
        >
          {renderItem ? (
            renderItem(item, index, { isSelected, value })
          ) : (
            <Box className="h-16 w-full justify-center">
              <Text size="md" className={optionTextClassName}>
                {itemLabel}
              </Text>
            </Box>
          )}
        </TouchableOpacity>
      </Box>
    );
  };

  /**
   * renderDropdown
   */
  const _renderDropdown = ({ onChange, onBlur, value }: any) => (
    <>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={computedSnapPoints}
        onChange={handleSheetChanges}
        enableDynamicSizing={false}
        enableOverDrag={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: sheetBackgroundColor,
        }}
      >
        <BottomSheetFlatList
          data={items}
          keyExtractor={(i, idx) => String(i?.[valueField] ?? `${idx}`)}
          renderItem={({ item, index }) =>
            renderOption(item, index, value, onChange)
          }
          contentContainerClassName={listContentClassName}
          contentContainerStyle={{ paddingTop: 0, paddingBottom: 50 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Box className={sheetContentClassName}>
              <HStack className="w-full px-5 pb-4 items-center justify-between">
                <Text size="lg" className="font-semibold">
                  {sheetTitle || `Seleccionar ${label.toLowerCase()}`}
                </Text>
                {hasManageAction ? (
                  <TouchableOpacity
                    onPress={handleManagePress}
                    className="h-8 px-1 items-center justify-center"
                  >
                    <Text
                      size="sm"
                      className="font-medium underline"
                      style={{ color: primaryColor[500] }}
                    >
                      {manageLabel}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Box />
                )}
              </HStack>
            </Box>
          }
        />
      </BottomSheetModal>

      {/* trigger */}
      {renderTrigger ? (
        <TouchableOpacity
          disabled={isDisabled}
          onPress={handlePresentModalPress}
        >
          {renderTrigger({
            value,
            open: handlePresentModalPress,
            disabled: isDisabled,
          })}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          disabled={isDisabled}
          onPress={handlePresentModalPress}
        >
          {/* className="h-16 border border-gray-400 rounded-md p-2 justify-between items-center" */}
          <HStack
            className={`${triggerClassName} ${triggerBackgroundClassName}`}
          >
            <Text
              size="lg"
              className={
                isDisabled || !(value?.[valueField] ?? value?.value)
                  ? "text-gray-500"
                  : `text-white ${triggerTextClassName}`
              }
            >
              {value?.[labelField] ?? value?.label ?? "Seleccionar un elemento"}
            </Text>
            <Icon as={ChevronDownIcon} size="md" className={iconClassName} />
          </HStack>
        </TouchableOpacity>
      )}

      {/* end */}
    </>
  );

  /**
   * render
   */
  return (
    <>
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
    </>
  );
};
