import type { JBSelectOption } from '../../forms';

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

const normalizeDigits = (value: string): string => value.replace(/\D+/g, '');

export const resolveCountryCodeValue = (
  value: JBSelectOption<string> | string | null | undefined
): string => {
  if (typeof value === 'string') {
    return value;
  }
  return value?.value ?? '';
};

export const buildE164Phone = (
  countryCode: JBSelectOption<string> | string | null | undefined,
  phone: string | null | undefined
): string => {
  const country = resolveCountryCodeValue(countryCode).replace(/[^\d+]/g, '');
  const normalizedCountry = country.startsWith('+') ? country : `+${normalizeDigits(country)}`;
  const localDigits = normalizeDigits(phone ?? '');
  return `${normalizedCountry}${localDigits}`;
};

export const isValidE164Phone = (value: string): boolean => E164_REGEX.test(value);
