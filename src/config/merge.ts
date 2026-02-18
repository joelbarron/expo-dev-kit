const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const deepMerge = <T extends Record<string, unknown>>(base: T, overrides?: Record<string, unknown>): T => {
  if (!overrides) {
    return { ...base };
  }

  const output: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(overrides)) {
    const baseValue = output[key];

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      output[key] = deepMerge(baseValue, overrideValue);
      continue;
    }

    if (overrideValue !== undefined) {
      output[key] = overrideValue;
    }
  }

  return output as T;
};
