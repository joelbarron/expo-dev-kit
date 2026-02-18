import { JBSelectOption } from '../../forms';

export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export type Gender = (typeof GENDERS)[number];

export const DEFAULT_GENDER: Gender = 'MALE';

export const GENDER_SELECT_OPTIONS: Array<JBSelectOption<Gender>> = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'OTHER', label: 'Otro' }
];
