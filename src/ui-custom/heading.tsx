// @ts-nocheck
import React from 'react';
import { Heading as BaseHeading } from '../ui/heading';

export const Heading = React.forwardRef(function JBHeadingCustom(
  { className = '', ...props }: any,
  ref
) {
  return (
    <BaseHeading ref={ref} className={`text-white ${className}`.trim()} {...props} />
  );
});

Heading.displayName = 'Heading';

