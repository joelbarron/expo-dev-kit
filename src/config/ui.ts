import { getColor } from "../utils/colors";

import { JBUIColorConfig, JBUIColorModeValue, JBUIColorValue } from "./types";

const isUIColorModeValue = (
  value: JBUIColorConfig | undefined,
): value is JBUIColorModeValue =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const resolveColorToken = (token: string): string | undefined => {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    return undefined;
  }

  const [colorName, ...pathParts] = normalizedToken.split(".");
  const palette = getColor(colorName);
  if (!palette) {
    return undefined;
  }

  if (pathParts.length === 0) {
    if (typeof palette === "string") {
      return palette;
    }
    if (typeof palette?.[500] === "string") {
      return palette[500];
    }
    return undefined;
  }

  let cursor: any = palette;
  for (const pathPart of pathParts) {
    if (cursor == null) {
      return undefined;
    }
    const numericKey = Number(pathPart);
    cursor = Number.isNaN(numericKey)
      ? cursor[pathPart]
      : (cursor[numericKey] ?? cursor[pathPart]);
  }

  return typeof cursor === "string" ? cursor : undefined;
};

const resolveColorValue = (value?: JBUIColorValue): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "function") {
    const resolved = value();
    return typeof resolved === "string" && resolved.trim() ? resolved : undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return resolveColorToken(normalized) ?? normalized;
};

export const resolveJBUIColor = (
  value: JBUIColorConfig | undefined,
  mode: "light" | "dark",
  fallback?: string,
): string | undefined => {
  if (!value) {
    return fallback;
  }

  const modeValue = isUIColorModeValue(value)
    ? mode === "dark"
      ? (value.dark ?? value.default ?? value.light)
      : (value.light ?? value.default ?? value.dark)
    : value;

  return resolveColorValue(modeValue) ?? fallback;
};

