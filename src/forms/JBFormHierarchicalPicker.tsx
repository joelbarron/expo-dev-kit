// @ts-nocheck
import { getColor } from "../utils/colors";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useController } from "react-hook-form";
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

type Props = {
  control: any;
  parentFieldName: string;
  childFieldName: string;
  label: string;
  parents?: any[];
  loadChildren: (parentId: number) => Promise<any[]>;
  rules?: any;
  helperText?: string;
  isDisabled?: boolean;
  manageLabel?: string;
  managePath?: string;
  onRefreshItems?: () => Promise<any> | void;
  sheetTitleParent?: string;
  sheetTitleChild?: string;
  triggerPlaceholder?: string;
  parentChipLabel?: string;
  changeParentLabel?: string;
  emptyText?: string;
  loadingText?: string;
  getParentColor?: (item: any) => string | undefined;
  getParentLabel?: (item: any) => string;
  getChildLabel?: (item: any) => string;
  getParentId?: (item: any) => number | string;
  getChildId?: (item: any) => number | string;
  sheetBackgroundColor?: string;
  triggerClassName?: string;
  triggerBackgroundClassName?: string;
  triggerTextClassName?: string;
  iconClassName?: string;
  sheetContentClassName?: string;
  listContentClassName?: string;
  optionContainerClassName?: string;
  optionClassName?: string;
  optionSelectedClassName?: string;
  optionTextClassName?: string;
  useParentColorOnTrigger?: boolean;
  useParentColorOnSelectedOptions?: boolean;
};

const backgroundColor = getColor("background");
const primaryColor = getColor("primary");
const TouchableOpacity: any = RNTouchableOpacity;

const defaultGetLabel = (item: any) => item?.label ?? item?.name ?? "Sin nombre";
const defaultGetId = (item: any) => item?.value ?? item?.id;
const defaultGetColor = (item: any) => item?.color;

export function JBFormHierarchicalPicker({
  control,
  parentFieldName,
  childFieldName,
  label,
  parents = [],
  loadChildren,
  rules = {},
  helperText,
  isDisabled = false,
  manageLabel,
  managePath,
  onRefreshItems,
  sheetTitleParent = "Selecciona una categoría",
  sheetTitleChild = "Selecciona una subcategoría",
  triggerPlaceholder = "Seleccionar categoría y subcategoría",
  parentChipLabel = "Categoría",
  changeParentLabel = "Cambiar",
  emptyText = "Sin elementos",
  loadingText = "Cargando...",
  getParentColor = defaultGetColor,
  getParentLabel = defaultGetLabel,
  getChildLabel = defaultGetLabel,
  getParentId = defaultGetId,
  getChildId = defaultGetId,
  sheetBackgroundColor,
  triggerClassName = "h-16 rounded-xl items-center justify-between px-3",
  triggerBackgroundClassName = "bg-background-200",
  triggerTextClassName = "",
  iconClassName = "text-white mr-1",
  sheetContentClassName = "pt-5",
  listContentClassName = "pb-24",
  optionContainerClassName = "w-full justify-center items-center",
  optionClassName = "mb-3 rounded-xl w-[90%] self-center bg-background-200 px-4 py-2",
  optionSelectedClassName = "bg-primary-500",
  optionTextClassName = "p-2 text-white",
  useParentColorOnTrigger = false,
  useParentColorOnSelectedOptions = false,
}: Props) {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const shouldReopenOnFocusRef = useRef(false);
  const [step, setStep] = useState<"parents" | "children">("parents");
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const snapPoints = useMemo(() => ["45%", "70%"], []);

  const { field: parentField, fieldState: { error: parentError } } = useController({
    control,
    name: parentFieldName,
  });

  const { field: childField, fieldState: { error: childError } } = useController({
    control,
    name: childFieldName,
    rules,
  });

  const error = childError || parentError;

  const open = useCallback(async () => {
    if (isDisabled) return;
    const currentParent = parentField.value;
    const currentParentId = currentParent ? Number(getParentId(currentParent)) : null;
    if (currentParentId) {
      setSelectedParent(currentParent);
      setLoadingChildren(true);
      bottomSheetRef.current?.present();
      try {
        const result = await loadChildren(currentParentId);
        setChildren(result ?? []);
        setStep("children");
      } finally {
        setLoadingChildren(false);
      }
      return;
    }
    setStep("parents");
    setSelectedParent(null);
    setChildren([]);
    bottomSheetRef.current?.present();
  }, [getParentId, isDisabled, loadChildren, parentField.value]);

  const close = useCallback(() => bottomSheetRef.current?.dismiss(), []);

  const renderBackdrop = useCallback((props: any) => (
    <BottomSheetBackdrop {...props} pressBehavior="close" appearsOnIndex={0} disappearsOnIndex={-1} />
  ), []);

  const hasManageAction = Boolean(manageLabel && managePath);
  const handleManagePress = useCallback(() => {
    if (!managePath) return;
    shouldReopenOnFocusRef.current = true;
    close();
    router.push(managePath as any);
  }, [close, managePath, router]);

  useFocusEffect(
    useCallback(() => {
      if (!shouldReopenOnFocusRef.current) return;
      shouldReopenOnFocusRef.current = false;
      Promise.resolve(onRefreshItems?.())
        .catch(() => {})
        .finally(() => {
          requestAnimationFrame(() => open());
        });
    }, [onRefreshItems, open]),
  );

  const handleSelectParent = useCallback(async (item: any) => {
    setSelectedParent(item);
    setLoadingChildren(true);
    try {
      const result = await loadChildren(Number(getParentId(item)));
      setChildren(result ?? []);
      setStep("children");
    } finally {
      setLoadingChildren(false);
    }
  }, [getParentId, loadChildren]);

  const handleSelectChild = useCallback((item: any) => {
    parentField.onChange(selectedParent);
    childField.onChange(item);
    close();
  }, [childField, close, parentField, selectedParent]);

  const currentLabel = useMemo(() => {
    const p = parentField.value;
    const c = childField.value;
    if (p && c) return `${getParentLabel(p)} · ${getChildLabel(c)}`;
    return triggerPlaceholder;
  }, [childField.value, getChildLabel, getParentLabel, parentField.value, triggerPlaceholder]);

  const listData = step === "parents" ? parents : children;
  const activeParent = selectedParent ?? parentField.value;
  const selectedParentColor = activeParent ? getParentColor(activeParent) : undefined;

  return (
    <FormControl isInvalid={!!error} isDisabled={isDisabled} isRequired={!!rules?.required}>
      <FormControlLabel className="mb-3">
        <FormControlLabelText className="text-white">{label}</FormControlLabelText>
      </FormControlLabel>

      <TouchableOpacity disabled={isDisabled} onPress={open}>
        <HStack
          className={`${triggerClassName} ${triggerBackgroundClassName}`}
          style={
            useParentColorOnTrigger && selectedParentColor
              ? {
                  backgroundColor: selectedParentColor,
                  borderWidth: 1.5,
                  borderColor: selectedParentColor,
                }
              : undefined
          }
        >
          <Text
            size="md"
            className={`${parentField.value && childField.value ? "text-white" : "text-gray-400"} ${triggerTextClassName}`}
            numberOfLines={1}
          >
            {currentLabel}
          </Text>
          <Icon as={ChevronDownIcon} size="md" className={iconClassName} />
        </HStack>
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enableOverDrag={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: sheetBackgroundColor || backgroundColor[950] }}
      >
        <Box className={sheetContentClassName}>
          <HStack className="px-5 pb-3 items-center justify-between">
            <Text size="lg" className="font-semibold">
              {step === "parents" ? sheetTitleParent : sheetTitleChild}
            </Text>
            {hasManageAction ? (
              <TouchableOpacity onPress={handleManagePress}>
                <Text size="sm" className="font-medium underline" style={{ color: primaryColor[500] }}>
                  {manageLabel}
                </Text>
              </TouchableOpacity>
            ) : (
              <Box />
            )}
          </HStack>

          {step === "children" ? (
            <HStack className="px-5 pb-3 items-center justify-between">
              <HStack
                className="h-9 max-w-[70%] rounded-full px-3 items-center"
                style={{
                  backgroundColor: (activeParent && getParentColor(activeParent)) || backgroundColor[400],
                }}
                space="sm"
              >
                <Box className="w-2.5 h-2.5 rounded-full bg-white/80" />
                <Text size="sm" className="font-semibold text-white" numberOfLines={1}>
                  {activeParent ? getParentLabel(activeParent) : parentChipLabel}
                </Text>
              </HStack>

              <TouchableOpacity onPress={() => setStep("parents")}>
                <Text size="sm" className="text-primary-500">{changeParentLabel}</Text>
              </TouchableOpacity>
            </HStack>
          ) : null}

          <BottomSheetFlatList
            data={loadingChildren ? [] : listData}
            keyExtractor={(item, idx) => String((step === "parents" ? getParentId(item) : getChildId(item)) ?? idx)}
            contentContainerClassName={listContentClassName}
            contentContainerStyle={{ paddingTop: 0, paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Box className="px-5 py-8">
                <Text size="sm" className="text-gray-400">
                  {loadingChildren ? loadingText : emptyText}
                </Text>
              </Box>
            }
            renderItem={({ item }) => {
              const isSelected = step === "parents"
                ? String(getParentId(parentField.value)) === String(getParentId(item))
                : String(getChildId(childField.value)) === String(getChildId(item));

              const optionColor = step === "parents"
                ? getParentColor(item)
                : ((activeParent && getParentColor(activeParent)) || primaryColor[500]);

              return (
                <Box className={optionContainerClassName}>
                  <TouchableOpacity
                    onPress={() => (step === "parents" ? handleSelectParent(item) : handleSelectChild(item))}
                    className={`${optionClassName} ${isSelected ? optionSelectedClassName : ""}`}
                    style={
                      isSelected && useParentColorOnSelectedOptions && optionColor
                        ? {
                            backgroundColor: optionColor,
                            borderWidth: 1,
                            borderColor: primaryColor[500],
                          }
                        : undefined
                    }
                  >
                    <Box className="h-10 w-full justify-center">
                      <Text size="md" className={optionTextClassName}>
                        {step === "parents" ? getParentLabel(item) : getChildLabel(item)}
                      </Text>
                    </Box>
                  </TouchableOpacity>
                </Box>
              );
            }}
          />
        </Box>
      </BottomSheetModal>

      {helperText ? (
        <FormControlHelper>
          <FormControlHelperText>{helperText}</FormControlHelperText>
        </FormControlHelper>
      ) : null}

      {error ? (
        <FormControlError>
          <FormControlErrorIcon as={AlertCircleIcon} />
          <FormControlErrorText>{error.message || "Error"}</FormControlErrorText>
        </FormControlError>
      ) : null}
    </FormControl>
  );
}
