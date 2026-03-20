import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";

import { getLastCreatedJBExpoConfig, resolveJBUIColor } from "../config";
import { useColorScheme } from "../hooks";
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
  iconPosition?: "start" | "end";
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

const resolveButtonConfigColor = ({
  uiButtonConfig,
  mode,
  action,
  variant,
  colorKey,
}: {
  uiButtonConfig: any;
  mode: "light" | "dark";
  action: string;
  variant: string;
  colorKey: "backgroundColor" | "borderColor" | "textColor" | "iconColor";
}): string | undefined => {
  if (!uiButtonConfig) {
    return undefined;
  }

  const actionConfig =
    (action ? uiButtonConfig?.[action] : undefined) ?? uiButtonConfig?.default;
  const actionVariantConfig = actionConfig?.[variant];
  const globalVariantConfig = uiButtonConfig?.[variant];

  const colorConfig =
    actionVariantConfig?.[colorKey] ??
    actionConfig?.[colorKey] ??
    globalVariantConfig?.[colorKey] ??
    uiButtonConfig?.[colorKey];

  return resolveJBUIColor(colorConfig, mode);
};

export function JBFormButton({
  text,
  loading = false,
  loadingText,
  buttonType = "default",
  showText,
  showIcon,
  iconName,
  iconPosition = "end",
  iconSize = 18,
  iconColor,
  textClassName = "text-[15px] font-bold text-white",
  className,
  size = "xl",
  variant = "solid",
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
  const scheme = useColorScheme();
  const baseConfig = getLastCreatedJBExpoConfig();
  const resolvedIconColor =
    iconColor ??
    resolveButtonConfigColor({
      uiButtonConfig: baseConfig?.ui?.button,
      mode: scheme,
      action: resolvedAction,
      variant,
      colorKey: "iconColor",
    }) ??
    "#ffffff";
  const iconElement =
    !loading && shouldShowIcon && resolvedIcon ? (
      <MaterialCommunityIcons
        name={resolvedIcon}
        size={iconSize}
        color={resolvedIconColor}
      />
    ) : null;

  return (
    <Button
      size={size}
      variant={variant}
      action={resolvedAction}
      className={`${className ?? "px-4"} ${loading ? "data-[disabled=true]:opacity-100" : ""}`.trim()}
      isDisabled={isButtonVisualDisabled}
      disabled={isButtonDisabled}
      {...rest}
    >
      {loading ? <ButtonSpinner color="#ffffff" /> : null}
      {iconPosition === "start" ? iconElement : null}
      {shouldShowText ? (
        <ButtonText className={textClassName}>
          {loading ? resolvedLoadingText : resolvedText}
        </ButtonText>
      ) : null}
      {iconPosition === "end" ? iconElement : null}
      {children}
    </Button>
  );
}
