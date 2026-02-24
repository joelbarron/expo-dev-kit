import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";

import { Button, ButtonSpinner, ButtonText } from "../ui/button";

type JBFormButtonType =
  | "default"
  | "save"
  | "delete"
  | "email"
  | "edit"
  | "add";

type JBFormButtonProps = Omit<React.ComponentProps<typeof Button>, "children"> & {
  children?: React.ReactNode;
  text?: string;
  loading?: boolean;
  loadingText?: string;
  buttonType?: JBFormButtonType;
  showText?: boolean;
  showIcon?: boolean;
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconSize?: number;
  iconColor?: string;
  textClassName?: string;
};

const typeIconMap: Record<JBFormButtonType, React.ComponentProps<typeof MaterialCommunityIcons>["name"] | undefined> = {
  default: undefined,
  save: "content-save",
  delete: "delete",
  email: "email-outline",
  edit: "pencil",
  add: "plus",
};

const typeTextMap: Record<JBFormButtonType, string> = {
  default: "",
  save: "Guardar",
  delete: "Eliminar",
  email: "Enviar",
  edit: "Editar",
  add: "Agregar",
};

const typeLoadingTextMap: Record<JBFormButtonType, string> = {
  default: "Cargando...",
  save: "Guardando...",
  delete: "Eliminando...",
  email: "Enviando...",
  edit: "Guardando...",
  add: "Guardando...",
};

const typeActionMap: Record<
  JBFormButtonType,
  "primary" | "secondary" | "positive" | "negative" | "default"
> = {
  default: "primary",
  save: "primary",
  delete: "negative",
  email: "primary",
  edit: "primary",
  add: "primary",
};

export function JBFormButton({
  text,
  loading = false,
  loadingText,
  buttonType = "default",
  showText,
  showIcon,
  iconName,
  iconSize = 18,
  iconColor = "white",
  textClassName = "text-[15px] font-bold text-white",
  className,
  size = "xl",
  disabled,
  isDisabled,
  action,
  children,
  ...rest
}: JBFormButtonProps) {
  const resolvedAction = action ?? typeActionMap[buttonType];
  const resolvedText = text ?? typeTextMap[buttonType] ?? "";
  const resolvedLoadingText = loadingText ?? typeLoadingTextMap[buttonType];
  const resolvedIcon = iconName ?? typeIconMap[buttonType];
  const shouldShowText = showText ?? Boolean(resolvedText);
  const shouldShowIcon = showIcon ?? Boolean(resolvedIcon);
  const isButtonDisabled = Boolean(disabled || isDisabled || loading);
  const isButtonVisualDisabled = Boolean(disabled || isDisabled);

  return (
    <Button
      size={size}
      action={resolvedAction}
      className={`${className ?? "px-4"} ${loading ? "data-[disabled=true]:opacity-100" : ""}`.trim()}
      isDisabled={isButtonVisualDisabled}
      disabled={isButtonDisabled}
      {...rest}
    >
      {loading ? <ButtonSpinner color="#ffffff" /> : null}
      {!loading && shouldShowIcon && resolvedIcon ? (
        <MaterialCommunityIcons name={resolvedIcon} size={iconSize} color={iconColor} />
      ) : null}
      {shouldShowText ? (
        <ButtonText className={textClassName}>
          {loading ? resolvedLoadingText : resolvedText}
        </ButtonText>
      ) : null}
      {children}
    </Button>
  );
}
