// @ts-nocheck
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "../ui/alert-dialog";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";
import { Heading } from "../ui/heading";
import { Icon, TrashIcon } from "../ui/icon";
import { Text } from "../ui/text";

type ConfirmationDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  showIcon?: boolean;
  title?: string;
  content?: string;
  agreeText?: string;
  agreeColor?:
    | "default"
    | "primary"
    | "secondary"
    | "positive"
    | "negative"
    | undefined;
  disagreeText?: string;
  disagreeColor?:
    | "default"
    | "primary"
    | "secondary"
    | "positive"
    | "negative"
    | undefined;
  onAgree?: () => void;
  onDisAgree?: () => void;
  disagreeTextButtonClassName?: string;
};

export const ConfirmationDialog = ({
  open,
  setOpen,
  showIcon = true,
  title = "Eliminar registro",
  content = "¿Estás seguro que deseas eliminar el registro? Recuerda que esta acción no se podrá revertir.",
  agreeText = "Sí, deseo eliminar",
  agreeColor = "negative",
  disagreeText = "Cancelar",
  disagreeColor = "secondary",
  onAgree,
  onDisAgree,

  disagreeTextButtonClassName = "",
}: ConfirmationDialogProps) => {
  /**
   * handle agree action
   */
  const handleClickAgree = () => {
    if (onAgree) {
      onAgree();
    } else {
      setOpen(false);
    }
  };

  /**
   * handle disagree action
   */
  const handleClickDisagree = () => {
    if (onDisAgree) {
      onDisAgree();
    } else {
      setOpen(false);
    }
  };

  /**
   * handle close dialogs
   */
  const handleClose = () => {
    setOpen(false);
  };

  /**
   * render
   */
  return (
    <AlertDialog isOpen={open} onClose={handleClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="w-full max-w-[415px] gap-4 items-center">
        {showIcon && (
          <Box className="rounded-full h-[52px] w-[52px] bg-background-error items-center justify-center mb-2">
            <Icon as={TrashIcon} size="lg" className="stroke-error-500" />
          </Box>
        )}

        <AlertDialogHeader className="mb-2">
          <Heading size="lg">{title}</Heading>
        </AlertDialogHeader>
        <AlertDialogBody>
          <Text size="md" className="text-center">
            {content}
          </Text>
        </AlertDialogBody>
        <AlertDialogFooter className="mt-5">
          <Button
            size="sm"
            action={agreeColor}
            onPress={handleClickAgree}
            className="px-[30px]"
          >
            <ButtonText action={agreeColor}>{agreeText}</ButtonText>
          </Button>
          <Button
            variant="outline"
            action={disagreeColor}
            onPress={handleClickDisagree}
            size="sm"
            className="px-[30px]"
          >
            <ButtonText
              action={disagreeColor}
              className={disagreeTextButtonClassName}
            >
              {disagreeText}
            </ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
