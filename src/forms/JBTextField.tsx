// @ts-nocheck
import { ReactNode } from 'react';
import { Controller, FieldPath, FieldValues } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { JBBaseFieldProps } from './types';

type JBTextFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> =
  JBBaseFieldProps<TFieldValues, TName> & {
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: TextInputProps['keyboardType'];
    autoCapitalize?: TextInputProps['autoCapitalize'];
    rightSlot?: ReactNode;
  };

export function JBTextField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: JBTextFieldProps<TFieldValues, TName>
) {
  const {
    control,
    name,
    label,
    placeholder,
    rules,
    disabled = false,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    rightSlot
  } = props;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, disabled ? styles.inputDisabled : null]}
              editable={!disabled}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              value={typeof value === 'string' ? value : value == null ? '' : String(value)}
              onBlur={onBlur}
              onChangeText={onChange}
              secureTextEntry={secureTextEntry}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
            />
            {rightSlot}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
    backgroundColor: '#ffffff'
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6'
  },
  error: {
    marginTop: 6,
    color: '#dc2626'
  }
});
