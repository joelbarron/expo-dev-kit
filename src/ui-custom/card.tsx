// @ts-nocheck
import React from 'react';
import { Card as BaseCard } from '../ui/card';

export const Card = React.forwardRef(function JBCardCustom(
  { className = '', ...props }: any,
  ref
) {
  return (
    <BaseCard
      ref={ref}
      className={`bg-white/95 dark:bg-background-200 border border-white/10 ${className}`.trim()}
      {...props}
    />
  );
});

Card.displayName = 'Card';

