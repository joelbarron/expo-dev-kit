import { JBSelectOption } from '../../forms';

export const DEFAULT_OTP_COUNTRY_CODE = '+52';

const COUNTRY_CALLING_CODES = ['+1', '+34', '+52', '+54', '+57'];

export const COUNTRY_CALLING_CODE_OPTIONS: Array<JBSelectOption<string>> = COUNTRY_CALLING_CODES.map((code) => ({
  value: code,
  label: code
}));
