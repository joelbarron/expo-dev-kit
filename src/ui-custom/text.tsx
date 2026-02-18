// @ts-nocheck
import React from 'react';
import { Text as BaseText } from '../ui/text';

export const Text = React.forwardRef(function JBTextCustom(
  { className = '', ...props }: any,
  ref
) {
  return <BaseText ref={ref} className={`text-white ${className}`.trim()} {...props} />;
});

Text.displayName = 'Text';

