// @ts-nocheck
import React from 'react';
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText as BaseFormControlHelperText,
  FormControlLabel,
  FormControlLabelAstrick as BaseFormControlLabelAstrick,
  FormControlLabelText as BaseFormControlLabelText,
} from '../ui/form-control';

export { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlHelper, FormControlLabel };

export const FormControlLabelText = React.forwardRef(function JBFormControlLabelTextCustom(
  { className = '', ...props }: any,
  ref
) {
  return (
    <BaseFormControlLabelText
      ref={ref}
      className={`text-white ${className}`.trim()}
      {...props}
    />
  );
});

export const FormControlLabelAstrick = React.forwardRef(
  function JBFormControlLabelAstrickCustom(
    { className = '', ...props }: any,
    ref
  ) {
    return (
      <BaseFormControlLabelAstrick
        ref={ref}
        className={`text-white ${className}`.trim()}
        {...props}
      />
    );
  }
);

export const FormControlHelperText = React.forwardRef(
  function JBFormControlHelperTextCustom(
    { className = '', ...props }: any,
    ref
  ) {
    return (
      <BaseFormControlHelperText
        ref={ref}
        className={`text-gray-400 ${className}`.trim()}
        {...props}
      />
    );
  }
);

FormControlLabelText.displayName = 'FormControlLabelText';
FormControlLabelAstrick.displayName = 'FormControlLabelAstrick';
FormControlHelperText.displayName = 'FormControlHelperText';

