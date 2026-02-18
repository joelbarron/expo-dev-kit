export const getDjangoLikePasswordError = (password: string): string | null => {
  if (!password) {
    return 'Debes ingresar tu contraseña.';
  }

  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra mayúscula.';
  }

  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra minúscula.';
  }

  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un número.';
  }

  return null;
};

export const isPasswordTooSimilar = (password: string, values: Array<string | undefined>) => {
  const normalizedPassword = password.trim().toLowerCase();
  if (!normalizedPassword) {
    return false;
  }

  return values.some((item) => {
    const normalizedValue = item?.trim().toLowerCase();
    return Boolean(normalizedValue && normalizedValue.length >= 3 && normalizedPassword.includes(normalizedValue));
  });
};
