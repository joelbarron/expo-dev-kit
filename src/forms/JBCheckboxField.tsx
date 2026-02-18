// @ts-nocheck
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, FieldPath, FieldValues } from 'react-hook-form';

import { JBBaseFieldProps } from './types';

type JBCheckboxFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> =
  JBBaseFieldProps<TFieldValues, TName> & {
    label: string;
  };

export function JBCheckboxField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: JBCheckboxFieldProps<TFieldValues, TName>
) {
  const { control, name, label, rules, disabled = false } = props;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const checked = Boolean(value);

        return (
          <View style={styles.container}>
            <Pressable
              onPress={() => !disabled && onChange(!checked)}
              style={styles.row}
              disabled={disabled}
            >
              <View style={[styles.box, checked ? styles.boxChecked : null]} />
              <Text style={styles.label}>{label}</Text>
            </Pressable>
            {error?.message ? <Text style={styles.error}>{error.message}</Text> : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6b7280',
    backgroundColor: '#ffffff'
  },
  boxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  label: {
    color: '#111827'
  },
  error: {
    marginTop: 6,
    color: '#dc2626'
  }
});
