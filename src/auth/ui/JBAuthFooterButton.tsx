import React from "react";

import { getAuthFooterButtonsConfig, getLastCreatedJBExpoConfig } from "../../config";
import { useAppConfigStore } from "../../runtime";
import { JBFormButton } from "../../forms";

type JBAuthFooterButtonSlot = "primary" | "secondary";

type JBAuthFooterButtonProps = React.ComponentProps<typeof JBFormButton> & {
  slot?: JBAuthFooterButtonSlot;
};

const slotFallbacks: Record<
  JBAuthFooterButtonSlot,
  {
    variant: "solid" | "outline" | "link";
    action: "default" | "primary" | "secondary" | "positive" | "negative";
    size: "xs" | "sm" | "md" | "lg" | "xl";
    className: string;
    textClassName?: string;
  }
> = {
  primary: {
    variant: "solid",
    action: "primary",
    size: "xl",
    className: "px-4",
  },
  secondary: {
    variant: "link",
    action: "primary",
    size: "sm",
    className: "self-center px-0",
    textClassName: "text-sm font-medium text-primary-600 dark:text-primary-300",
  },
};

export function JBAuthFooterButton({
  slot = "primary",
  action,
  variant,
  size,
  className,
  textClassName,
  ...rest
}: JBAuthFooterButtonProps) {
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const resolvedConfig = {
    ...baseConfig,
    auth: {
      ...(baseConfig?.auth ?? {}),
      ...(appConfig?.auth ?? {}),
    },
    ui: {
      ...(baseConfig?.ui ?? {}),
      ...(appConfig?.ui ?? {}),
      auth: {
        ...(baseConfig?.ui?.auth ?? {}),
        ...(appConfig?.ui?.auth ?? {}),
      },
    },
  };
  const footerConfig = getAuthFooterButtonsConfig(resolvedConfig);
  const slotConfig = footerConfig?.[slot] ?? {};
  const fallback = slotFallbacks[slot];

  return (
    <JBFormButton
      action={action ?? slotConfig.action ?? fallback.action}
      variant={variant ?? slotConfig.variant ?? fallback.variant}
      size={size ?? slotConfig.size ?? fallback.size}
      className={className ?? slotConfig.className ?? fallback.className}
      textClassName={
        textClassName ??
        slotConfig.textClassName ??
        fallback.textClassName
      }
      {...rest}
    />
  );
}
