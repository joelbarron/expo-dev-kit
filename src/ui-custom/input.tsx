// @ts-nocheck
import React from 'react';
import {
  Input as BaseInput,
  InputField as BaseInputField,
  InputIcon,
  InputSlot,
} from '../ui/input';

export const Input = BaseInput;
export { InputIcon, InputSlot };

export const InputField = React.forwardRef(function JBInputFieldCustom(
  { className = '', ...props }: any,
  ref
) {
  return (
    <BaseInputField
      ref={ref}
      className={`text-white placeholder:text-gray-400 ${className}`.trim()}
      {...props}
    />
  );
});

InputField.displayName = 'InputField';

