import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import Toast from "react-native-toast-message";

import { JBMainLayout } from "../../core/layout/JBMainLayout";
import { JBFormButton } from "../../forms/JBFormButton";
import { ConfirmationDialog } from "../../shared/ConfirmationDialog";
import { Box } from "../../ui/box";
import { Heading } from "../../ui/heading";
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
  manageDescription?: string;
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
  title = mode === "select" ? "Elige un método de pago" : "Tus métodos de pago",
  manageDescription = "Administra tus tarjetas para pagar tus reservas más rápido.",
  selectedMethodId = null,
  queryKey,
  loadPaymentMethods,
  onSelectConfirm,
  onCancel,
  onAddMethod,
  onDeleteMethod,
  addButtonText = "Agregar método de pago",
  emptyText = "No tienes métodos guardados todavía.",
  confirmButtonText = "Usar este método",
  cancelButtonText = "Cancelar",
  deleteButtonText = "Eliminar",
}: JBPaymentMethodsScreenProps) {
  const [selectedId, setSelectedId] = useState<JBPaymentMethodId | null>(selectedMethodId);
  const [deleteCandidate, setDeleteCandidate] = useState<JBPaymentMethod | null>(null);

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
      setDeleteCandidate(null);
      Toast.show({
        type: "success",
        text1: "Método eliminado",
      });
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: "No se pudo eliminar el método",
      });
    },
  });

  const canConfirm = mode === "select" && Boolean(selectedMethod) && Boolean(onSelectConfirm);
  const isBusy = deletingMethod || isLoading || isRefetching;
  const isDeleteDialogOpen = Boolean(deleteCandidate);
  const deleteCandidateMasked = deleteCandidate
    ? `**** ${String(deleteCandidate.cardLast4 ?? deleteCandidate.card_last4 ?? "").trim()}`
    : "";

  return (
    <>
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
              {onCancel ? (
                <JBFormButton
                  text={cancelButtonText}
                  variant="link"
                  className="px-0"
                  textClassName={FOOTER_CANCEL_TEXT_CLASS_NAME}
                  onPress={onCancel}
                />
              ) : null}
            </VStack>
          ) : onAddMethod ? (
            <JBFormButton text={addButtonText} onPress={onAddMethod} isDisabled={isBusy} />
          ) : undefined
        }
        footerClassName={mode === "select" || onAddMethod ? "px-5 py-4" : ""}
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
              <VStack space="xs">
                <Heading size="xl" className="text-typography-black dark:text-typography-white">
                  {title}
                </Heading>
                <Text className="text-sm text-typography-600 dark:text-typography-400">
                  {manageDescription}
                </Text>
              </VStack>

              {!methods?.length ? (
                <Box className="rounded-2xl border border-outline-200 px-4 py-4 dark:border-outline-700">
                  <Text className="text-typography-600 dark:text-typography-400">{emptyText}</Text>
                </Box>
              ) : (
                <VStack className="w-full" space="md">
                  {methods.map((method) => (
                    <VStack key={String(method.id)} className="w-full" space="xs">
                      <JBPaymentMethodCard
                        method={method}
                        selectable={false}
                        disabled={isBusy}
                        showDeleteAction={Boolean(onDeleteMethod)}
                        deleteDisabled={isBusy}
                        onDeletePress={
                          onDeleteMethod
                            ? () => {
                                setDeleteCandidate(method);
                              }
                            : undefined
                        }
                      />
                    </VStack>
                  ))}
                </VStack>
              )}

              {error ? (
                <Box className="rounded-2xl border border-outline-200 px-4 py-4 dark:border-outline-700">
                  <Text className="text-typography-700 dark:text-typography-300">
                    No se pudieron cargar los métodos de pago.
                  </Text>
                  <JBFormButton
                    text="Reintentar"
                    variant="outline"
                    iconName="reload"
                    iconPosition="start"
                    className="mt-2"
                    onPress={() => refetch()}
                  />
                </Box>
              ) : null}
            </VStack>
          )}
        </ScrollView>
      </JBMainLayout>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        setOpen={(open) => {
          if (!open && deletingMethod) return;
          if (!open) setDeleteCandidate(null);
          if (open && !deleteCandidate) return;
        }}
        contentClassName="w-full max-w-[415px] items-center gap-5 rounded-3xl border border-outline-200 bg-background-light px-5 py-7 dark:border-outline-700 dark:bg-background-0"
        title="Eliminar método de pago"
        content={
          deleteCandidateMasked
            ? `¿Seguro que deseas eliminar el método ${deleteCandidateMasked}? Esta acción no se puede deshacer.`
            : "¿Seguro que deseas eliminar este método de pago? Esta acción no se puede deshacer."
        }
        agreeText={deleteButtonText}
        agreeColor="negative"
        agreeVariant="solid"
        agreeLoading={deletingMethod}
        agreeDisabled={deletingMethod || !deleteCandidate}
        disagreeText="Conservar método"
        disagreeColor="primary"
        disagreeVariant="solid"
        disagreeDisabled={deletingMethod}
        onAgree={() => {
          if (!deleteCandidate) return;
          removeMethod(deleteCandidate);
        }}
        onDisAgree={() => {
          if (deletingMethod) return;
          setDeleteCandidate(null);
        }}
        closeOnAgree={false}
      />
    </>
  );
}
