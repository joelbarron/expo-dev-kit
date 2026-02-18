import { Control, FieldPath, FieldValues, RegisterOptions } from 'react-hook-form';

export type JBSelectOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

export type JBBaseFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  rules?: RegisterOptions<TFieldValues, TName>;
  disabled?: boolean;
};
