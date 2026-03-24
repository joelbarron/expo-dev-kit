import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import Toast from "react-native-toast-message";

import { JBMainLayout } from "../../core/layout/JBMainLayout";
import { JBFormButton } from "../../forms/JBFormButton";
import { Box } from "../../ui/box";
import { Heading } from "../../ui/heading";
import { HStack } from "../../ui/hstack";
import { Text } from "../../ui/text";
import { VStack } from "../../ui/vstack";
import { JBPaymentMethodCard } from "../JBPaymentMethodCard";
import { JBPaymentMethodSelector } from "../JBPaymentMethodSelector";
import type { JBPaymentMethod, JBPaymentMethodId } from "../types";

const FOOTER_CANCEL_TEXT_CLASS_NAME =
  "text-[15px] font-semibold text-typography-white dark:text-typography-white";

export type JBPaymentMethodsScreenMode = "select" | "manage";

export type JBPaymentMethodsScreenProps = {
  mode?: JBPaymentMethodsScreenMode;
  title?: string;
  selectedMethodId?: JBPaymentMethodId | null;
  queryKey?: unknown[];
  loadPaymentMethods: () => Promise<JBPaymentMethod[]>;
  onSelectConfirm?: (method: JBPaymentMethod) => void;
  onCancel?: () => void;
  onAddMethod?: () => void;
  onDeleteMethod?: (method: JBPaymentMethod) => Promise<void> | void;
  addButtonText?: string;
  emptyText?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  deleteButtonText?: string;
};

const normalizeId = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

export function JBPaymentMethodsScreen({
  mode = "manage",
  title = mode === "select" ? "Elige un metodo de pago" : "Metodos de pago",
  selectedMethodId = null,
  queryKey,
  loadPaymentMethods,
  onSelectConfirm,
  onCancel,
  onAddMethod,
  onDeleteMethod,
  addButtonText = "Agregar metodo de pago",
  emptyText = "No tienes metodos guardados todavia.",
  confirmButtonText = "Usar este metodo",
  cancelButtonText = "Cancelar",
  deleteButtonText = "Eliminar",
}: JBPaymentMethodsScreenProps) {
  const [selectedId, setSelectedId] = useState<JBPaymentMethodId | null>(selectedMethodId);

  const paymentMethodsQueryKey = queryKey ?? ["jb-payment-methods", mode];

  const {
    data: methods,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<JBPaymentMethod[]>({
    queryKey: paymentMethodsQueryKey,
    queryFn: loadPaymentMethods,
  });

  useEffect(() => {
    setSelectedId(selectedMethodId ?? null);
  }, [selectedMethodId]);

  useEffect(() => {
    if (!methods?.length) {
      setSelectedId(null);
      return;
    }

    const currentSelected = normalizeId(selectedId);
    const exists = methods.some((method) => normalizeId(method.id) === currentSelected);
    if (currentSelected && exists) {
      return;
    }

    const defaultMethod = methods.find((method) => Boolean(method.default));
    const fallback = defaultMethod ?? methods[0];
    setSelectedId(fallback?.id ?? null);
  }, [methods, selectedId]);

  const selectedMethod = useMemo(() => {
    if (!methods?.length) return null;
    const normalized = normalizeId(selectedId);
    if (!normalized) return null;
    return methods.find((method) => normalizeId(method.id) === normalized) ?? null;
  }, [methods, selectedId]);

  const { mutate: removeMethod, isPending: deletingMethod } = useMutation({
    mutationFn: async (method: JBPaymentMethod) => {
      if (!onDeleteMethod) return;
      await onDeleteMethod(method);
    },
    onSuccess: async () => {
      await refetch();
      Toast.show({
        type: "success",
        text1: "Metodo eliminado",
      });
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: "No se pudo eliminar el metodo",
      });
    },
  });

  const canConfirm = mode === "select" && Boolean(selectedMethod) && Boolean(onSelectConfirm);
  const isBusy = deletingMethod || isLoading || isRefetching;

  return (
    <JBMainLayout
      scrollable
      contentContainerStyle={{ paddingBottom: 24 }}
      footer={
        mode === "select" ? (
          <VStack space="sm" className="w-full">
            <JBFormButton
              text={confirmButtonText}
              isDisabled={!canConfirm || isBusy}
              onPress={() => {
                if (!selectedMethod || !onSelectConfirm) return;
                onSelectConfirm(selectedMethod);
              }}
            />
            <JBFormButton
              text={cancelButtonText}
              variant="link"
              className="px-0"
              textClassName={FOOTER_CANCEL_TEXT_CLASS_NAME}
              onPress={onCancel}
            />
          </VStack>
        ) : undefined
      }
      footerClassName={mode === "select" ? "px-5 py-4" : ""}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={Boolean(isRefetching)} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {mode === "select" ? (
          <JBPaymentMethodSelector
            title={title}
            methods={methods ?? []}
            selectedId={selectedId}
            onChange={(idOrNull) => setSelectedId(idOrNull)}
            allowUnselect={false}
            disabled={isBusy}
            onAddMethod={onAddMethod}
            addMethodText={addButtonText}
            emptyText={emptyText}
          />
        ) : (
          <VStack className="w-full" space="md">
            <HStack className="items-center justify-between">
              <Heading size="xl" className="text-typography-black dark:text-typography-white">
                {title}
              </Heading>
              {onAddMethod ? (
                <JBFormButton
                  text={addButtonText}
                  variant="link"
                  className="px-0"
                  onPress={onAddMethod}
                />
              ) : null}
            </HStack>

            {!methods?.length ? (
              <Box className="rounded-2xl border border-outline-200 px-4 py-4 dark:border-outline-700">
                <Text className="text-typography-600 dark:text-typography-400">{emptyText}</Text>
              </Box>
            ) : (
              <VStack className="w-full" space="sm">
                {methods.map((method) => (
                  <Box key={String(method.id)} className="w-full">
                    <JBPaymentMethodCard
                      method={method}
                      selectable={false}
                      disabled={isBusy}
                    />
                    {onDeleteMethod ? (
                      <HStack className="mt-2 justify-end">
                        <JBFormButton
                          text={deleteButtonText}
                          variant="link"
                          action="negative"
                          className="px-0"
                          isDisabled={isBusy}
                          onPress={() => removeMethod(method)}
                        />
                      </HStack>
                    ) : null}
                  </Box>
                ))}
              </VStack>
            )}

            {error ? (
              <Box className="rounded-2xl border border-outline-200 px-4 py-4 dark:border-outline-700">
                <Text className="text-typography-700 dark:text-typography-300">
                  No se pudieron cargar los metodos de pago.
                </Text>
                <JBFormButton
                  text="Reintentar"
                  variant="link"
                  className="mt-2 px-0"
                  onPress={() => refetch()}
                />
              </Box>
            ) : null}
          </VStack>
        )}
      </ScrollView>
    </JBMainLayout>
  );
}
