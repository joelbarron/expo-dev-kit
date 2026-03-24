import React, { useMemo, useState } from "react";
import { ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { useMutation, useQuery } from "@tanstack/react-query";

import { JBMainLayout } from "../../core/layout/JBMainLayout";
import { JBFormButton } from "../../forms/JBFormButton";
import { Box } from "../../ui/box";
import { Card } from "../../ui-custom/card";
import { Text } from "../../ui/text";
import { VStack } from "../../ui/vstack";

const FOOTER_CANCEL_TEXT_CLASS_NAME =
  "text-[15px] font-semibold text-typography-white dark:text-typography-white";

type ConfirmSetupIntentResponse = {
  setupIntent?: {
    paymentMethod?: {
      id?: string | null;
    } | null;
  } | null;
  error?: {
    message?: string | null;
  } | null;
};

export type JBPaymentMethodManageScreenProps = {
  title?: string;
  description?: string;
  queryKeySetupIntent?: unknown[];
  loadSetupIntent: () => Promise<string>;
  confirmSetupIntent: (clientSecret: string) => Promise<ConfirmSetupIntentResponse>;
  savePaymentMethod: (paymentMethodId: string) => Promise<unknown>;
  onSaved?: (result: unknown) => void;
  onCancel?: () => void;
  saveButtonText?: string;
  savingButtonText?: string;
  cancelButtonText?: string;
  renderCardInput: (args: {
    onCardChange: (details: { complete?: boolean } | null) => void;
  }) => React.ReactNode;
};

export function JBPaymentMethodManageScreen({
  title,
  description = "Agrega una tarjeta para pagar de forma rápida y segura.",
  queryKeySetupIntent,
  loadSetupIntent,
  confirmSetupIntent,
  savePaymentMethod,
  onSaved,
  onCancel,
  saveButtonText = "Guardar método",
  savingButtonText = "Guardando...",
  cancelButtonText = "Cancelar",
  renderCardInput,
}: JBPaymentMethodManageScreenProps) {
  void title;
  const [cardDetails, setCardDetails] = useState<{ complete?: boolean } | null>(null);
  const showCancel = Boolean(onCancel) && Boolean(cancelButtonText?.trim());

  const setupIntentQueryKey = useMemo(
    () => queryKeySetupIntent ?? ["jb-payment-methods", "setup-intent"],
    [queryKeySetupIntent],
  );

  const {
    data: clientSecret,
    isLoading: loadingSecret,
    error: setupIntentError,
    refetch: refetchSetupIntent,
  } = useQuery({
    queryKey: setupIntentQueryKey,
    queryFn: loadSetupIntent,
  });

  const { mutate: persistMethod, isPending: isSavingMethod } = useMutation({
    mutationFn: async (paymentMethodId: string) => savePaymentMethod(paymentMethodId),
    onSuccess: (result) => {
      Toast.show({
        type: "success",
        text1: "Método guardado",
      });
      onSaved?.(result);
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: "No se pudo guardar el método",
      });
    },
  });

  const handleSave = async () => {
    if (!clientSecret || !cardDetails?.complete) {
      Toast.show({
        type: "info",
        text1: "Completa los datos de la tarjeta",
      });
      return;
    }

    const { setupIntent, error } = await confirmSetupIntent(clientSecret);
    if (error?.message) {
      Toast.show({
        type: "error",
        text1: error.message,
      });
      return;
    }

    const paymentMethodId = setupIntent?.paymentMethod?.id;
    if (!paymentMethodId) {
      Toast.show({
        type: "error",
        text1: "No se pudo confirmar la tarjeta",
      });
      return;
    }

    persistMethod(paymentMethodId);
  };

  if (loadingSecret || setupIntentError) {
    return (
      <JBMainLayout
        scrollable
        contentContainerStyle={{ paddingBottom: 24 }}
        footer={
          setupIntentError ? (
            <VStack space="sm" className="w-full">
              <JBFormButton
                text="Reintentar"
                variant="outline"
                iconName="reload"
                iconPosition="start"
                onPress={() => refetchSetupIntent()}
              />
              {showCancel ? (
                <JBFormButton
                  text={cancelButtonText}
                  variant="link"
                  className="px-0"
                  textClassName={FOOTER_CANCEL_TEXT_CLASS_NAME}
                  onPress={onCancel}
                />
              ) : null}
            </VStack>
          ) : undefined
        }
        footerClassName={setupIntentError ? "px-5 py-4" : ""}
      >
        <Box className="px-5 pt-6 pb-5">
          {loadingSecret ? (
            <Box className="items-center justify-center py-8">
              <ActivityIndicator />
            </Box>
          ) : (
            <Card className="px-4 py-4">
              <Text className="text-typography-700 dark:text-typography-300">
                No se pudo inicializar el método de pago.
              </Text>
            </Card>
          )}
        </Box>
      </JBMainLayout>
    );
  }

  return (
    <JBMainLayout
      scrollable
      contentContainerStyle={{ paddingBottom: 24 }}
      footer={
        <VStack space="sm" className="w-full">
          <JBFormButton
            text={isSavingMethod ? savingButtonText : saveButtonText}
            loading={isSavingMethod}
            isDisabled={isSavingMethod}
            onPress={handleSave}
          />
          {showCancel ? (
            <JBFormButton
              text={cancelButtonText}
              variant="link"
              className="px-0"
              textClassName={FOOTER_CANCEL_TEXT_CLASS_NAME}
              onPress={onCancel}
            />
          ) : null}
        </VStack>
      }
      footerClassName="px-5 py-4"
    >
      <Box className="px-5 pt-4 pb-5">
        <VStack space="md">
          <Text className="text-typography-600 dark:text-typography-400">{description}</Text>

          <Card className="border-0 px-4 py-4">
            {renderCardInput({
              onCardChange: setCardDetails,
            })}
          </Card>
        </VStack>
      </Box>
    </JBMainLayout>
  );
}
