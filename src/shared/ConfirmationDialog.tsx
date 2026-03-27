import React from "react";

import { JBFormButton } from "../forms/JBFormButton";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "../ui/alert-dialog";
import { Box } from "../ui/box";
import { Heading } from "../ui/heading";
import { Icon, TrashIcon } from "../ui/icon";
import { Text } from "../ui/text";

type DialogActionColor = "default" | "primary" | "secondary" | "positive" | "negative";
type DialogActionVariant = "solid" | "outline" | "link";
type DialogLayout = "row" | "column";

type ConfirmationDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  showIcon?: boolean;
  icon?: React.ReactNode;
  title?: string;
  content?: React.ReactNode;
  agreeText?: string;
  agreeColor?: DialogActionColor;
  agreeVariant?: DialogActionVariant;
  agreeLoading?: boolean;
  agreeDisabled?: boolean;
  disagreeText?: string;
  disagreeColor?: DialogActionColor;
  disagreeVariant?: DialogActionVariant;
  disagreeLoading?: boolean;
  disagreeDisabled?: boolean;
  hideAgree?: boolean;
  hideDisagree?: boolean;
  closeOnAgree?: boolean;
  closeOnDisAgree?: boolean;
  onAgree?: () => void | Promise<void>;
  onDisAgree?: () => void | Promise<void>;
  footerLayout?: DialogLayout;
  footerClassName?: string;
  contentClassName?: string;
  disagreeTextButtonClassName?: string;
  agreeButtonProps?: Partial<React.ComponentProps<typeof JBFormButton>>;
  disagreeButtonProps?: Partial<React.ComponentProps<typeof JBFormButton>>;
};

const defaultIcon = (
  <Box className="mb-1 h-[52px] w-[52px] items-center justify-center rounded-full bg-error-50 dark:bg-error-950/30">
    <Icon as={TrashIcon} size="lg" className="stroke-error-600 dark:stroke-error-400" />
  </Box>
);

const resolveDialogActionTextClass = (
  variant: DialogActionVariant,
  action: DialogActionColor,
  extraClassName = ""
) => {
  if (variant === "solid") {
    return `text-sm font-semibold ${extraClassName}`.trim();
  }

  const colorClassMap: Record<DialogActionColor, string> = {
    default: "text-typography-900 dark:text-typography-50",
    secondary: "text-typography-900 dark:text-typography-50",
    primary: "text-primary-600 dark:text-primary-300",
    positive: "text-green-600 dark:text-green-400",
    negative: "text-red-600 dark:text-red-400",
  };

  return `text-sm font-medium ${colorClassMap[action]} ${extraClassName}`.trim();
};

export const ConfirmationDialog = ({
  open,
  setOpen,
  showIcon = true,
  icon,
  title = "Eliminar registro",
  content = "¿Estás seguro que deseas eliminar el registro? Recuerda que esta acción no se podrá revertir.",
  agreeText = "Sí, deseo eliminar",
  agreeColor = "negative",
  agreeVariant = "solid",
  agreeLoading = false,
  agreeDisabled = false,
  disagreeText = "Cancelar",
  disagreeColor = "secondary",
  disagreeVariant = "outline",
  disagreeLoading = false,
  disagreeDisabled = false,
  hideAgree = false,
  hideDisagree = false,
  closeOnAgree = false,
  closeOnDisAgree = true,
  onAgree,
  onDisAgree,
  footerLayout = "row",
  footerClassName = "",
  contentClassName = "w-full max-w-[415px] items-center gap-4 rounded-3xl border border-outline-200 bg-background-light px-5 py-5 dark:border-outline-700 dark:bg-background-0",
  disagreeTextButtonClassName = "",
  agreeButtonProps,
  disagreeButtonProps,
}: ConfirmationDialogProps) => {
  const handleClose = () => setOpen(false);

  const handleClickAgree = async () => {
    await onAgree?.();
    if (!onAgree || closeOnAgree) {
      setOpen(false);
    }
  };

  const handleClickDisagree = async () => {
    await onDisAgree?.();
    if (!onDisAgree || closeOnDisAgree) {
      setOpen(false);
    }
  };

  const footerLayoutClass =
    footerLayout === "column"
      ? "w-full flex-col items-stretch gap-3"
      : "w-full flex-row items-stretch justify-stretch gap-3";

  return (
    <AlertDialog isOpen={open} onClose={handleClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className={contentClassName}>
        {showIcon ? (icon ?? defaultIcon) : null}

        <AlertDialogHeader className="mb-1">
          <Heading size="lg" className="text-center text-typography-black dark:text-typography-white">
            {title}
          </Heading>
        </AlertDialogHeader>

        <AlertDialogBody className="w-full">
          {typeof content === "string" ? (
            <Text size="md" className="text-center text-typography-700 dark:text-typography-300">
              {content}
            </Text>
          ) : (
            content
          )}
        </AlertDialogBody>

        <AlertDialogFooter className={`mt-5 w-full ${footerLayoutClass} ${footerClassName}`.trim()}>
          {!hideDisagree ? (
            <JBFormButton
              variant={disagreeVariant}
              action={disagreeColor}
              size="sm"
              text={disagreeText}
              loading={disagreeLoading}
              isDisabled={disagreeDisabled}
              textClassName={resolveDialogActionTextClass(
                disagreeVariant,
                disagreeColor,
                disagreeTextButtonClassName
              )}
              className={footerLayout === "column" ? "w-full" : "flex-1"}
              onPress={() => void handleClickDisagree()}
              {...disagreeButtonProps}
            />
          ) : null}

          {!hideAgree ? (
            <JBFormButton
              variant={agreeVariant}
              action={agreeColor}
              size="sm"
              text={agreeText}
              loading={agreeLoading}
              isDisabled={agreeDisabled}
              textClassName={resolveDialogActionTextClass(agreeVariant, agreeColor)}
              className={footerLayout === "column" ? "w-full" : "flex-1"}
              onPress={() => void handleClickAgree()}
              {...agreeButtonProps}
            />
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
