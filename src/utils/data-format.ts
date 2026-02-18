import moment from 'moment';

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
const DEFAULT_DATE_TIME_FORMAT = 'dddd DD MMM YYYY HH:mm:ss';
const DEFAULT_DATE_EXTENDED_FORMAT = 'DD-MMMM-YYYY';

const currencyFormatter = require('currency-formatter');

export const getFormattedCurrency = (amount: number | string) => {
  if (!amount) return '$0.00';
  return currencyFormatter.format(Number(amount), {
    symbol: '$',
    precision: 2
  });
};

export const getFormattedDateTimeExtended = (date?: string | Date) => {
  if (!date) return '';
  return moment(date).format(DEFAULT_DATE_EXTENDED_FORMAT);
};

export const getFormattedDateTime = (date?: string | Date) => {
  if (!date) return '';
  return moment(date).format(DEFAULT_DATE_TIME_FORMAT);
};

export const getFormattedDate = (date?: string | Date) => {
  if (!date) return '';
  return moment(date).format(DEFAULT_DATE_FORMAT);
};

export const capitalizeFirstLetter = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export function toNumber(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function formatMonthLabel(monthISO: string) {
  const d = new Date(`${monthISO}T00:00:00`);
  return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

export function clamp01(x: number) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
