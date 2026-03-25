import { useRouter } from 'expo-router';
import React, { useState } from 'react';

import { JBMainLayout } from '../../../core';
import { ConfirmationDialog } from '../../../shared';
import { Box } from '../../../ui';
import { JBUserHomeMenuList } from '../components';
import { createJBUserHomeDefaultOptions, useJBUserAccountMenu } from '../hooks';
import { JBUserHomeDefaultOptions, JBUserHomeMenuItem } from '../types';

export type JBUserHomeScreenProps = {
  basePath?: string;
  header?: React.ReactNode;
  options?: Array<JBUserHomeMenuItem>;
  extraOptions?: Array<JBUserHomeMenuItem>;
  includeDefaultOptions?: boolean;
  defaultOptions?: JBUserHomeDefaultOptions;
  className?: string;
  classNameScrollView?: string;
};

export function JBUserHomeScreen({
  basePath = '/user',
  header,
  options,
  extraOptions = [],
  includeDefaultOptions = true,
  defaultOptions,
  className,
  classNameScrollView,
}: JBUserHomeScreenProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<JBUserHomeMenuItem | null>(null);

  const menuOptions = useJBUserAccountMenu({
    basePath,
    options,
    extraOptions,
    includeDefaultOptions,
    defaultOptions,
  });

  const runOptionAction = async (item: JBUserHomeMenuItem) => {
    if (typeof item.onPress === 'function') {
      await item.onPress();
      return;
    }

    if (item.href) {
      router.push(item.href as any);
    }
  };

  const handleOptionPress = async (item: JBUserHomeMenuItem) => {
    if (item.confirmation) {
      setSelectedOption(item);
      return;
    }
    await runOptionAction(item);
  };

  const handleAgreeConfirmation = async () => {
    if (!selectedOption) {
      return;
    }
    await runOptionAction(selectedOption);
    setSelectedOption(null);
  };

  const handleCloseConfirmation = () => {
    setSelectedOption(null);
  };

  return (
    <>
      <JBMainLayout
        scrollable
        className={className ?? 'flex-1 bg-background-100 dark:bg-background-0'}
        classNameScrollView={classNameScrollView ?? 'flex-1'}
        header={header}
      >
        <Box className="px-4 pt-4 pb-6">
          <JBUserHomeMenuList items={menuOptions} onPressItem={(item) => void handleOptionPress(item)} />
        </Box>
      </JBMainLayout>

      <ConfirmationDialog
        open={Boolean(selectedOption)}
        setOpen={(open) => {
          if (!open) {
            setSelectedOption(null);
          }
        }}
        showIcon={false}
        title={selectedOption?.confirmation?.title ?? 'Cerrar sesion'}
        content={selectedOption?.confirmation?.content ?? 'Estas seguro de que deseas continuar?'}
        agreeText={selectedOption?.confirmation?.agreeText ?? 'Aceptar'}
        agreeColor={selectedOption?.confirmation?.agreeColor ?? 'primary'}
        disagreeText={selectedOption?.confirmation?.disagreeText ?? 'Cancelar'}
        disagreeColor={selectedOption?.confirmation?.disagreeColor ?? 'negative'}
        disagreeTextButtonClassName="text-red-500"
        onAgree={() => void handleAgreeConfirmation()}
        onDisAgree={handleCloseConfirmation}
      />
    </>
  );
}

export { createJBUserHomeDefaultOptions };
export type { JBUserHomeDefaultOptions, JBUserHomeMenuItem };
