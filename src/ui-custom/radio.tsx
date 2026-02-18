// @ts-nocheck
import React from 'react';
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel as BaseRadioLabel,
} from '../ui/radio';

export { Radio, RadioGroup, RadioIcon, RadioIndicator };

export const RadioLabel = React.forwardRef(function JBRadioLabelCustom(
  { className = '', ...props }: any,
  ref
) {
  return (
    <BaseRadioLabel
      ref={ref}
      className={`text-white data-[checked=true]:text-primary-500 ${className}`.trim()}
      {...props}
    />
  );
});

RadioLabel.displayName = 'RadioLabel';

