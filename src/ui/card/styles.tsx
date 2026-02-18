// @ts-nocheck
import { isWeb, tva } from "@gluestack-ui/utils/nativewind-utils";
const baseStyle = isWeb ? "flex flex-col relative z-0" : "";

export const cardStyle = tva({
  base: `bg-white/95 dark:bg-background-200 border border-black/5 dark:border-white/5 ${baseStyle}`,
  variants: {
    size: {
      sm: "p-3 rounded-xl",
      md: "p-4 rounded-2xl",
      lg: "p-6 rounded-3xl",
    },
    variant: {
      elevated: "shadow-md shadow-black/15",
      outline: "border border-outline-200 ",
      ghost: "rounded-none",
      filled: "bg-background-50",
    },
  },
});
