import React from 'react';

import { Box } from '../../ui/box';
import { Button, ButtonSpinner, ButtonText } from '../../ui/button';
import { Text } from '../../ui/text';

type JBAuthPrimaryButtonProps = React.ComponentProps<typeof Button> & {
  label: string;
  loading?: boolean;
  disabled?: boolean;
};

export const JBAuthPrimaryButton = ({
  label,
  loading = false,
  isDisabled,
  disabled,
  className,
  ...rest
}: JBAuthPrimaryButtonProps) => {
  const isButtonDisabled = Boolean(isDisabled || disabled || loading);

  return (
    <Button
      action="primary"
      size="xl"
      className={`mt-1 px-4 ${className ?? ''}`}
      isDisabled={isButtonDisabled}
      {...rest}
    >
      {loading ? <ButtonSpinner color="#ffffff" /> : null}
      <ButtonText className="text-[15px] font-bold text-white">{loading ? 'Cargando...' : label}</ButtonText>
    </Button>
  );
};

export const JBAuthSecondaryButton = ({ label, isDisabled, disabled, className, ...rest }: JBAuthPrimaryButtonProps) => {
  return (
    <Button
      variant="outline"
      action="primary"
      size="xl"
      className={`mt-2 px-4 ${className ?? ''}`}
      isDisabled={Boolean(isDisabled || disabled)}
      {...rest}
    >
      <ButtonText className="text-[14px] font-semibold text-primary-600 dark:text-primary-300">
        {label}
      </ButtonText>
    </Button>
  );
};

export const JBAuthAlert = ({ type = 'info', message }: { type?: 'info' | 'error' | 'success' | 'warning'; message: string }) => {
  const bgClassName =
    type === 'error'
      ? 'bg-red-100 border-red-700'
      : type === 'success'
        ? 'bg-green-100 border-green-700'
        : type === 'warning'
          ? 'bg-amber-100 border-amber-700'
          : 'bg-blue-100 border-blue-700';

  const textClassName =
    type === 'error'
      ? 'text-red-800'
      : type === 'success'
        ? 'text-green-800'
        : type === 'warning'
          ? 'text-amber-800'
          : 'text-blue-800';

  return (
    <Box className={`mb-3 rounded-xl border px-3 py-2.5 ${bgClassName}`}>
      <Text className={`text-sm font-medium ${textClassName}`}>{message}</Text>
    </Box>
  );
};
