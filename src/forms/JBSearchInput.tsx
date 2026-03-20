// @ts-nocheck
import { getColor } from "../utils/colors";
import { getLastCreatedJBExpoConfig, resolveJBUIColor } from "../config";
import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { TouchableOpacity } from "react-native";
import { useColorScheme } from "../hooks";
import { CustomLoader } from "../shared/CustomLoader";
import { Card } from "../ui/card";
import { Input, InputField } from "../ui/input";

type Props = {
  value: string;
  onChange: (text: string) => void;

  placeholder?: string;
  debounceMs?: number;

  loading?: boolean;
  autoFocus?: boolean;

  onSubmit?: (text: string) => void;
  onClear?: () => void;

  className?: string; // por si quieres adaptar contenedor con nativewind
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
  debounceMs = 300,
  loading = false,
  autoFocus = false,
  onSubmit,
  onClear,
  className,
}: Props) {
  const scheme = useColorScheme();
  const baseConfig = getLastCreatedJBExpoConfig();
  const zinc = getColor("zinc");
  const primary = getColor("primary");
  const typography = getColor("typography") ?? {};
  const background = getColor("background") ?? {};

  const resolvedInputTextColor = resolveJBUIColor(
    baseConfig?.ui?.forms?.textColor,
    scheme,
    scheme === "dark"
      ? typography.white ?? typography[50] ?? "#f8fafc"
      : typography.black ?? typography[900] ?? "#0f172a"
  );
  const resolvedPlaceholderColor =
    scheme === "dark" ? typography[400] ?? "#94a3b8" : typography[500] ?? "#64748b";
  const resolvedContainerBackgroundColor = resolveJBUIColor(
    baseConfig?.ui?.forms?.backgroundColor,
    scheme,
    scheme === "dark" ? background[200] ?? "#121b26" : background[100] ?? "#f1f5f9"
  );

  const [localValue, setLocalValue] = useState(value);
  const lastExternalValue = useRef(value);

  // sync cuando el value externo cambia (ej. reset de filtros)
  useEffect(() => {
    if (value !== lastExternalValue.current) {
      lastExternalValue.current = value;
      setLocalValue(value);
    }
  }, [value]);

  // debounce -> onChange
  useEffect(() => {
    const t = setTimeout(() => onChange(localValue), debounceMs);
    return () => clearTimeout(t);
  }, [localValue, debounceMs, onChange]);

  const showClear = useMemo(
    () => (localValue?.trim()?.length ?? 0) > 0,
    [localValue]
  );

  return (
    <Card
      className={className}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 13,
        borderRadius: 13,
        backgroundColor: resolvedContainerBackgroundColor,
      }}
    >
      <FontAwesome name="search" size={14} color={zinc[300]} />

      <Input variant="outline" size="md" className="flex-1 border-0 bg-transparent">
        <InputField
          value={localValue}
          onChangeText={setLocalValue}
          placeholder={placeholder}
          placeholderTextColor={resolvedPlaceholderColor}
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus={autoFocus}
          returnKeyType="search"
          onSubmitEditing={() => onSubmit?.(localValue)}
          className="text-sm py-0 px-0"
          style={{ color: resolvedInputTextColor }}
        />
      </Input>

      {loading ? (
        <CustomLoader size={6} color={primary[400]} gap={4} />
      ) : showClear ? (
        <TouchableOpacity
          onPress={() => {
            setLocalValue("");
            onClear?.();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.75}
        >
          <FontAwesome name="times-circle" size={16} color={zinc[300]} />
        </TouchableOpacity>
      ) : null}
    </Card>
  );
}
