export type ParsedAuthError = {
  rootMessage?: string;
  fieldErrors: Record<string, string>;
};

const pickFirstString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    const firstString = value.find((item) => typeof item === 'string');
    return typeof firstString === 'string' ? firstString : undefined;
  }
  return undefined;
};

export const parseAuthError = (
  error: unknown,
  aliases?: Record<string, string>
): ParsedAuthError => {
  const result: ParsedAuthError = {
    fieldErrors: {}
  };

  if (!error || typeof error !== 'object') {
    return result;
  }

  const maybeData = (error as { data?: unknown; response?: { data?: unknown }; message?: string }).data
    ?? (error as { response?: { data?: unknown } }).response?.data;

  if (!maybeData || typeof maybeData !== 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      result.rootMessage = message;
    }
    return result;
  }

  const data = maybeData as Record<string, unknown>;

  const rootCandidates = ['detail', 'message', 'nonFieldErrors', 'non_field_errors', 'error'];
  for (const key of rootCandidates) {
    const maybeMessage = pickFirstString(data[key]);
    if (maybeMessage) {
      result.rootMessage = maybeMessage;
      break;
    }
  }

  Object.entries(data).forEach(([field, value]) => {
    if (rootCandidates.includes(field)) {
      return;
    }

    const message = pickFirstString(value);
    if (!message) {
      return;
    }

    const normalizedField = aliases?.[field] ?? field;
    result.fieldErrors[normalizedField] = message;
  });

  return result;
};
