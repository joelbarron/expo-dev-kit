// @ts-nocheck
import Slider from "@react-native-community/slider";
import React from "react";
import { Controller } from "react-hook-form";
import { View } from "react-native";

import { getLastCreatedJBExpoConfig, resolveJBUIColor } from "../config";
import { useColorScheme } from "../hooks";
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
import { Text } from "../ui/text";
import { getColor } from "../utils";

type CustomFormSliderProps = {
  control: any;
  fieldName: string;
  label?: string;
  /** Inclusive lower bound. Default `0`. */
  min?: number;
  /** Inclusive upper bound. Default `100`. */
  max?: number;
  /** Step granularity. Default `1`. */
  step?: number;
  /**
   * How to render the value next to the label. Default `"percent"` appends
   * `%`, `"plain"` shows the bare number, `"none"` hides it. Pass a function
   * for full control (e.g. `(v) => `${v} días`).
   */
  valueFormat?: "percent" | "plain" | "none" | ((value: number) => string);
  /**
   * Form values are often stored as strings (matching `<TextInput>` defaults)
   * but the slider works with numbers. When `true` (default), the value
   * pushed back into RHF is coerced to `String(n)`. Set to `false` if you
   * already store numbers.
   */
  storeAsString?: boolean;
  defaultValue?: any;
  rules?: any;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  helperTextClassName?: string;
  errorTextClassName?: string;
};

const formatValue = (
  value: number,
  format: CustomFormSliderProps["valueFormat"],
): string => {
  if (typeof format === "function") return format(value);
  if (format === "none") return "";
  if (format === "plain") return String(value);
  return `${value}%`;
};

export const CustomFormSlider = ({
  control,
  fieldName,
  label = "",
  min = 0,
  max = 100,
  step = 1,
  valueFormat = "percent",
  storeAsString = true,
  helperText = undefined,
  defaultValue = undefined,
  isDisabled = false,
  isReadOnly = false,
  rules = {},
  containerClassName = "mb-4",
  labelClassName = "",
  valueClassName = "",
  helperTextClassName = "",
  errorTextClassName = "",
}: CustomFormSliderProps) => {
  const scheme = useColorScheme();
  const baseConfig = getLastCreatedJBExpoConfig();
  const primary = getColor("primary") ?? {};
  const typography = getColor("typography") ?? {};
  const background = getColor("background") ?? {};
  const redColor = getColor("red") ?? {};

  const resolvedErrorColor =
    scheme === "dark" ? redColor[500] ?? "#ef4444" : redColor[600] ?? "#dc2626";

  // Track / thumb colors derived from the primary palette so the slider
  // visually matches the rest of the form. Falls back to the lib's config
  // (`ui.forms.accentColor`) when the host app overrides it.
  const accentColor = resolveJBUIColor(
    baseConfig?.ui?.forms?.accentColor,
    scheme,
    primary[500] ?? "#10B981",
  );
  const minimumTrackTintColor = isDisabled
    ? scheme === "dark"
      ? typography[600] ?? "#475569"
      : typography[300] ?? "#cbd5e1"
    : accentColor;
  const maximumTrackTintColor =
    scheme === "dark" ? background[400] ?? "#334155" : background[200] ?? "#e2e8f0";
  const thumbTintColor = isDisabled
    ? scheme === "dark"
      ? typography[500] ?? "#64748b"
      : typography[400] ?? "#94a3b8"
    : accentColor;

  const defaultLabelColor =
    scheme === "dark"
      ? typography.white ?? typography[50] ?? "#f8fafc"
      : typography.black ?? typography[900] ?? "#0f172a";

  return (
    <Controller
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        // Coerce whatever shape the form holds (string from text inputs,
        // number from initial defaults, undefined on first render) into a
        // valid number inside the [min, max] range.
        const numericValue = (() => {
          const raw = value === undefined || value === null ? min : Number(value);
          if (Number.isNaN(raw)) return min;
          return Math.min(Math.max(raw, min), max);
        })();

        const formatted = formatValue(numericValue, valueFormat);
        const isNonInteractive = isDisabled || isReadOnly;

        return (
          <FormControl
            isInvalid={error ? true : false}
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            isRequired={rules?.required ? true : false}
            className={containerClassName}
          >
            <FormControlLabel className="mb-2">
              <View className="flex-row items-center justify-between w-full">
                <FormControlLabelText
                  className={labelClassName}
                  style={{ color: defaultLabelColor }}
                >
                  {label}
                </FormControlLabelText>
                {formatted ? (
                  <Text
                    className={`font-semibold ${valueClassName}`}
                    style={{ color: accentColor }}
                  >
                    {formatted}
                  </Text>
                ) : null}
              </View>
            </FormControlLabel>

            <Slider
              minimumValue={min}
              maximumValue={max}
              step={step}
              value={numericValue}
              disabled={isNonInteractive}
              minimumTrackTintColor={minimumTrackTintColor}
              maximumTrackTintColor={maximumTrackTintColor}
              thumbTintColor={thumbTintColor}
              onValueChange={(next) => {
                if (isNonInteractive) return;
                const rounded = Math.round(next);
                onChange(storeAsString ? String(rounded) : rounded);
              }}
              style={{ width: "100%", height: 40 }}
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
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  size="sm"
                  className="mt-2"
                  color={resolvedErrorColor}
                />
                <FormControlErrorText
                  className={`ml-2 mt-2 text-md leading-5 ${errorTextClassName}`}
                  style={{ color: resolvedErrorColor }}
                >
                  {error.message || "Error"}
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>
        );
      }}
      name={fieldName}
      rules={rules}
      defaultValue={defaultValue}
    />
  );
};
