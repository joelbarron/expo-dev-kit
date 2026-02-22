// @ts-nocheck
import { Picker } from '@react-native-picker/picker';
import { Controller, FieldPath, FieldValues } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { JBBaseFieldProps, JBSelectOption } from './types';

type JBSelectFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> =
  JBBaseFieldProps<TFieldValues, TName> & {
    options: Array<JBSelectOption<string>>;
  };

export function JBSelectField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: JBSelectFieldProps<TFieldValues, TName>
) {
  const { control, name, label, options, rules, disabled = false } = props;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          <View style={[styles.pickerWrap, disabled ? styles.pickerDisabled : null]}>
            <Picker
              enabled={!disabled}
              selectedValue={value ?? ''}
              onValueChange={(itemValue) => onChange(itemValue)}
            >
              {options.map((option, index) => (
                <Picker.Item
                  key={`${option.value}-${index}`}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
          {error?.message ? <Text style={styles.error}>{error.message}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12
  },
  label: {
    marginBottom: 8,
    color: '#111827',
    fontWeight: '600'
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#ffffff'
  },
  pickerDisabled: {
    backgroundColor: '#f3f4f6'
  },
  error: {
    marginTop: 6,
    color: '#dc2626'
  }
});
