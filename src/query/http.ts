export const extractHttpStatusCode = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const maybeResponse = (error as { response?: unknown }).response;
  if (!maybeResponse || typeof maybeResponse !== 'object') {
    return null;
  }

  const maybeStatus = (maybeResponse as { status?: unknown }).status;
  return typeof maybeStatus === 'number' ? maybeStatus : null;
};

export const isUnauthorizedError = (error: unknown): boolean => extractHttpStatusCode(error) === 401;
