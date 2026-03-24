import React, { memo, useCallback } from "react";
import { Pressable } from "react-native";

import { CardIssuer } from "../shared/CardIssuer";
import { Card } from "../ui-custom/card";
import { Box } from "../ui/box";
import { HStack } from "../ui/hstack";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";
import type { JBPaymentMethod, JBPaymentMethodId } from "./types";

export type JBPaymentMethodCardProps = {
  method: JBPaymentMethod;
  selected?: boolean;
  disabled?: boolean;
  selectable?: boolean;
  className?: string;
  onPress?: (id: JBPaymentMethodId, method: JBPaymentMethod) => void;
};

const getBrand = (method: JBPaymentMethod): string =>
  String(method.cardBrand ?? method.card_brand ?? "CARD").toUpperCase();

const getLast4 = (method: JBPaymentMethod): string =>
  String(method.cardLast4 ?? method.card_last4 ?? "****");

const getExpMonth = (method: JBPaymentMethod): number | null => {
  const value = Number(method.expMonth ?? method.exp_month ?? NaN);
  return Number.isFinite(value) ? value : null;
};

const getExpYear = (method: JBPaymentMethod): number | null => {
  const value = Number(method.expYear ?? method.exp_year ?? NaN);
  return Number.isFinite(value) ? value : null;
};

const toIssuer = (brand: string): string => {
  const normalized = String(brand).toUpperCase();
  if (normalized.includes("VISA")) return "VISA";
  if (normalized.includes("MASTER")) return "MASTERCARD";
  if (normalized.includes("AMEX") || normalized.includes("AMERICAN")) return "AMEX";
  return "CASH";
};

const RadioIndicator = ({ selected = false }: { selected?: boolean }) => (
  <Box
    className={`h-5 w-5 items-center justify-center rounded-full border ${
      selected ? "border-primary-500" : "border-outline-300 dark:border-outline-600"
    }`}
  >
    {selected ? <Box className="h-2.5 w-2.5 rounded-full bg-primary-500" /> : null}
  </Box>
);

export const JBPaymentMethodCard = memo(
  ({
    method,
    selected = false,
    disabled = false,
    selectable = true,
    className = "",
    onPress,
  }: JBPaymentMethodCardProps) => {
    const brand = getBrand(method);
    const last4 = getLast4(method);
    const expMonth = getExpMonth(method);
    const expYear = getExpYear(method);
    const isDefault = Boolean(method.default);

    const handlePress = useCallback(() => {
      if (disabled || !onPress) return;
      onPress(method.id, method);
    }, [disabled, method, onPress]);

    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
      >
        <Card
          className={`w-full overflow-hidden rounded-2xl border px-4 py-3 ${
            selected
              ? "border-primary-500 bg-primary-50/70 dark:bg-primary-950/25"
              : "border-outline-200 dark:border-outline-700"
          } ${disabled ? "opacity-60" : ""} ${className}`}
        >
          <HStack className="items-start justify-between" space="sm">
            <HStack className="flex-1 items-center" space="sm">
              <Box className="h-10 w-10 items-center justify-center rounded-xl bg-black/5 dark:bg-white/10">
                <CardIssuer
                  issuer={toIssuer(brand)}
                  size={20}
                  color={selected ? "#0ea5e9" : "#334155"}
                />
              </Box>
              <VStack className="flex-1" space="xs">
                <Text
                  className="text-typography-800 dark:text-typography-100"
                  numberOfLines={1}
                >
                  {brand}
                </Text>
                <Text
                  className="text-sm font-semibold text-typography-black dark:text-typography-white"
                  numberOfLines={1}
                >
                  {"**** **** **** "}
                  {last4}
                </Text>
              </VStack>
            </HStack>
            {selectable ? <RadioIndicator selected={selected} /> : null}
          </HStack>

          <Text className="mt-2 text-xs text-typography-600 dark:text-typography-400">
            Expira{" "}
            {expMonth && expYear
              ? `${String(expMonth).padStart(2, "0")}/${expYear}`
              : "N/D"}
            {isDefault ? " • Predeterminada" : ""}
          </Text>
        </Card>
      </Pressable>
    );
  },
);

JBPaymentMethodCard.displayName = "JBPaymentMethodCard";
