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
  categoryFieldName: string;
  subcategoryFieldName: string;
  label: string;
  categories?: any[];
  loadSubcategories: (categoryId: number) => Promise<any[]>;
  rules?: any;
  helperText?: string;
  isDisabled?: boolean;
  manageLabel?: string;
  managePath?: string;
  onRefreshItems?: () => Promise<any> | void;
};

const backgroundColor = getColor("background");
const primaryColor = getColor("primary");
const TouchableOpacity: any = RNTouchableOpacity;

export function CustomFormExpenseCategoryPicker({
  control,
  categoryFieldName,
  subcategoryFieldName,
  label,
  categories = [],
  loadSubcategories,
  rules = {},
  helperText,
  isDisabled = false,
  manageLabel,
  managePath,
  onRefreshItems,
}: Props) {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const shouldReopenOnFocusRef = useRef(false);
  const [step, setStep] = useState<"categories" | "subcategories">(
    "categories",
  );
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const snapPoints = useMemo(() => ["45%", "70%"], []);

  const {
    field: categoryField,
    fieldState: { error: categoryError },
  } = useController({
    control,
    name: categoryFieldName,
  });

  const {
    field: subcategoryField,
    fieldState: { error: subcategoryError },
  } = useController({
    control,
    name: subcategoryFieldName,
    rules,
  });

  const error = subcategoryError || categoryError;

  const open = useCallback(async () => {
    if (isDisabled) return;

    const currentCategory = categoryField.value;
    if (currentCategory?.value || currentCategory?.id) {
      setSelectedCategory(currentCategory);
      setLoadingSubcategories(true);
      bottomSheetRef.current?.present();
      try {
        const categoryId = Number(
          currentCategory?.value ?? currentCategory?.id,
        );
        const result = await loadSubcategories(categoryId);
        setSubcategories(result ?? []);
        setStep("subcategories");
      } finally {
        setLoadingSubcategories(false);
      }
      return;
    }

    setStep("categories");
    setSelectedCategory(null);
    setSubcategories([]);
    bottomSheetRef.current?.present();
  }, [categoryField.value, isDisabled, loadSubcategories]);

  const close = useCallback(() => {
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
          requestAnimationFrame(() => {
            open();
          });
        });
    }, [onRefreshItems, open]),
  );

  const handleSelectCategory = useCallback(
    async (item: any) => {
      setSelectedCategory(item);
      setLoadingSubcategories(true);
      try {
        const result = await loadSubcategories(Number(item?.value ?? item?.id));
        setSubcategories(result ?? []);
        setStep("subcategories");
      } finally {
        setLoadingSubcategories(false);
      }
    },
    [loadSubcategories],
  );

  const handleSelectSubcategory = useCallback(
    (item: any) => {
      categoryField.onChange(selectedCategory);
      subcategoryField.onChange(item);
      close();
    },
    [categoryField, close, selectedCategory, subcategoryField],
  );

  const currentLabel = useMemo(() => {
    if (categoryField.value?.label && subcategoryField.value?.label) {
      return `${categoryField.value.label} · ${subcategoryField.value.label}`;
    }
    return "Seleccionar categoría y subcategoría";
  }, [categoryField.value, subcategoryField.value]);

  const listData = step === "categories" ? categories : subcategories;
  const selectedCategoryColor = categoryField.value?.color as
    | string
    | undefined;

  return (
    <FormControl
      isInvalid={!!error}
      isDisabled={isDisabled}
      isRequired={!!rules?.required}
    >
      <FormControlLabel className="mb-3">
        <FormControlLabelText className="text-white">
          {label}
        </FormControlLabelText>
      </FormControlLabel>

      <TouchableOpacity disabled={isDisabled} onPress={open}>
        <HStack
          className="h-16 rounded-xl items-center justify-between px-3"
          style={{
            backgroundColor: selectedCategoryColor
              ? selectedCategoryColor
              : backgroundColor[200],
            borderWidth: 1.5,
            borderColor: selectedCategoryColor
              ? selectedCategoryColor
              : backgroundColor[200],
          }}
        >
          <Text
            size="md"
            className={
              categoryField.value?.label && subcategoryField.value?.label
                ? "text-white"
                : "text-gray-400"
            }
          >
            {currentLabel}
          </Text>
          <Icon as={ChevronDownIcon} size="md" className="text-white mr-1" />
        </HStack>
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enableOverDrag={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: backgroundColor[950] }}
      >
        <Box className="pt-4">
          <HStack className="px-5 pb-3 items-center justify-between">
            <Text size="lg" className="font-semibold">
              {step === "categories"
                ? "Selecciona una categoría"
                : "Selecciona una subcategoría"}
            </Text>
            {hasManageAction ? (
              <TouchableOpacity onPress={handleManagePress}>
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

          {step === "subcategories" ? (
            <HStack className="px-5 pb-3 items-center justify-between">
              <HStack
                className="h-9 max-w-[70%] rounded-full px-3 items-center"
                style={{
                  backgroundColor: selectedCategory?.color
                    ? selectedCategory.color
                    : backgroundColor[400],
                }}
                space="sm"
              >
                <Box className="w-2.5 h-2.5 rounded-full bg-white/80" />
                <Text
                  size="sm"
                  className="font-semibold text-white"
                  numberOfLines={1}
                >
                  {selectedCategory?.label ??
                    selectedCategory?.name ??
                    "Categoría"}
                </Text>
              </HStack>

              <TouchableOpacity onPress={() => setStep("categories")}>
                <Text size="sm" className="text-primary-500">
                  Cambiar
                </Text>
              </TouchableOpacity>
            </HStack>
          ) : null}

          <BottomSheetFlatList
            data={loadingSubcategories ? [] : listData}
            keyExtractor={(item, idx) => String(item?.value ?? item?.id ?? idx)}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Box className="px-5 py-8">
                <Text size="sm" className="text-gray-400">
                  {loadingSubcategories ? "Cargando..." : "Sin elementos"}
                </Text>
              </Box>
            }
            renderItem={({ item }) => {
              const itemLabel = item?.label ?? item?.name ?? "Sin nombre";
              const isSelected =
                step === "categories"
                  ? categoryField.value?.value === item?.value
                  : subcategoryField.value?.value === item?.value;
              const optionColor =
                step === "categories"
                  ? item?.color
                  : (selectedCategory?.color ?? primaryColor[500]);

              return (
                <TouchableOpacity
                  onPress={() =>
                    step === "categories"
                      ? handleSelectCategory(item)
                      : handleSelectSubcategory(item)
                  }
                >
                  <Box
                    className="w-[90%] self-center mb-3 h-16 rounded-xl px-4 justify-center"
                    style={{
                      backgroundColor: isSelected
                        ? optionColor || primaryColor[500]
                        : backgroundColor[200],
                      borderWidth: 1,
                      borderColor: isSelected
                        ? primaryColor[500]
                        : backgroundColor[200],
                    }}
                  >
                    <Text size="md">{itemLabel}</Text>
                  </Box>
                </TouchableOpacity>
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
          <FormControlErrorText>
            {error.message || "Error"}
          </FormControlErrorText>
        </FormControlError>
      ) : null}
    </FormControl>
  );
}
