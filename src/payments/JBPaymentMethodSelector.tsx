import React, { useCallback } from "react";

import { Button, ButtonText } from "../ui/button";
import { Box } from "../ui/box";
import { Heading } from "../ui/heading";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";
import { JBPaymentMethodCard } from "./JBPaymentMethodCard";
import type { JBPaymentMethod, JBPaymentMethodId } from "./types";

export type JBPaymentMethodSelectorProps = {
  title?: string;
  methods: JBPaymentMethod[];
  selectedId: JBPaymentMethodId | null;
  onChange: (idOrNull: JBPaymentMethodId | null, method?: JBPaymentMethod | null) => void;
  disabled?: boolean;
  emptyText?: string;
  allowUnselect?: boolean;
  cardClassName?: string;
  onAddMethod?: () => void;
  addMethodText?: string;
};

const normalizeId = (value: JBPaymentMethodId | null | undefined): string =>
  value === null || value === undefined ? "" : String(value);

export function JBPaymentMethodSelector({
  title = "Selecciona un metodo de pago",
  methods,
  selectedId,
  onChange,
  disabled = false,
  emptyText = "No tienes metodos guardados.",
  allowUnselect = true,
  cardClassName = "",
  onAddMethod,
  addMethodText = "Agregar nuevo metodo de pago",
}: JBPaymentMethodSelectorProps) {
  const selectedIdValue = normalizeId(selectedId);

  const handleSelect = useCallback(
    (id: JBPaymentMethodId, method: JBPaymentMethod) => {
      const isSame = normalizeId(id) === selectedIdValue;
      if (allowUnselect && isSame) {
        onChange(null, null);
        return;
      }
      onChange(id, method);
    },
    [allowUnselect, onChange, selectedIdValue],
  );

  return (
    <VStack space="md" className="w-full">
      <Heading size="xl" className="text-typography-900">
        {title}
      </Heading>

      {methods?.length ? (
        <VStack space="sm" className="w-full">
          {methods.map((method) => (
            <JBPaymentMethodCard
              key={String(method.id)}
              method={method}
              selected={normalizeId(method.id) === selectedIdValue}
              onPress={handleSelect}
              disabled={disabled}
              className={cardClassName}
            />
          ))}
        </VStack>
      ) : (
        <Box className="rounded-2xl border border-outline-200 px-4 py-4 dark:border-outline-700">
          <Text className="text-typography-600">{emptyText}</Text>
        </Box>
      )}

      {onAddMethod ? (
        <Button size="lg" variant="link" onPress={onAddMethod} isDisabled={disabled}>
          <ButtonText>{addMethodText}</ButtonText>
        </Button>
      ) : null}
    </VStack>
  );
}
