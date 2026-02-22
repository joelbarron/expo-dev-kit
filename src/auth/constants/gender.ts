import { JBSelectOption } from '../../forms';

export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;
export type Gender = (typeof GENDERS)[number];

export const DEFAULT_GENDER: Gender = 'OTHER';

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  OTHER: 'Otro',
  PREFER_NOT_TO_SAY: 'Prefiero no decirlo'
};

export const GENDER_SELECT_OPTIONS = GENDERS.map((value) => ({
  value,
  label: GENDER_LABELS[value]
}));
