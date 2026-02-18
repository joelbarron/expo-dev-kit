// @ts-nocheck
import React from 'react';
import { Textarea as BaseTextarea, TextareaInput as BaseTextareaInput } from '../ui/textarea';

export const Textarea = BaseTextarea;

export const TextareaInput = React.forwardRef(function JBTextareaInputCustom(
  { className = '', ...props }: any,
  ref
) {
  return (
    <BaseTextareaInput
      ref={ref}
      className={`text-white placeholder:text-gray-400 ${className}`.trim()}
      {...props}
    />
  );
});

TextareaInput.displayName = 'TextareaInput';

