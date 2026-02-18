// @ts-nocheck
import { MaterialIcons } from '@expo/vector-icons';
import { Motion } from '@legendapp/motion';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable } from 'react-native';

import { Box } from '../../ui/box';
import { Button, ButtonText } from '../../ui/button';
import { Text } from '../../ui/text';
import { VStack } from '../../ui/vstack';

type Variant = 'success' | 'error' | 'info';

type FullScreenToastProps = {
  open: boolean;
  variant?: Variant;
  title: string;
  message?: string;
  onClose: () => void;
  autoHideMs?: number;
  actionLabel?: string;
  showAction?: boolean;
};

export type JBFullScreenToastPayload = {
  variant?: Variant;
  title: string;
  message?: string;
  autoHideMs?: number;
  actionLabel?: string;
  showAction?: boolean;
};

type FullScreenToastContextValue = {
  show: (payload: JBFullScreenToastPayload) => void;
  dismiss: () => void;
};

const FullScreenToastContext = createContext<FullScreenToastContextValue | null>(null);

export function useFullScreenToast() {
  const ctx = useContext(FullScreenToastContext);
  if (!ctx) {
    throw new Error('useFullScreenToast must be used within FullScreenToastProvider');
  }

  return ctx;
}

const variantMap: Record<
  Variant,
  {
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
    bg: string;
    accent: string;
  }
> = {
  success: {
    icon: 'check-circle',
    color: '#ffffff',
    bg: 'rgba(255,255,255,0.18)',
    accent: '#22c55e'
  },
  error: {
    icon: 'error',
    color: '#ffffff',
    bg: 'rgba(255,255,255,0.18)',
    accent: '#f87171'
  },
  info: {
    icon: 'info',
    color: '#ffffff',
    bg: 'rgba(255,255,255,0.18)',
    accent: '#60a5fa'
  }
};

export function FullScreenToastProvider({ children }: { children: React.ReactNode }) {
  const [toastState, setToastState] = useState<JBFullScreenToastPayload & { open: boolean }>({
    open: false,
    variant: 'info',
    title: '',
    message: '',
    autoHideMs: 2200,
    actionLabel: 'OK',
    showAction: false
  });

  const value = useMemo<FullScreenToastContextValue>(
    () => ({
      show: (payload) =>
        setToastState((prev) => ({
          ...prev,
          ...payload,
          open: true
        })),
      dismiss: () =>
        setToastState((prev) => ({
          ...prev,
          open: false
        }))
    }),
    []
  );

  return (
    <FullScreenToastContext.Provider value={value}>
      {children}
      <FullScreenToast
        open={toastState.open}
        variant={toastState.variant}
        title={toastState.title}
        message={toastState.message}
        autoHideMs={toastState.autoHideMs}
        actionLabel={toastState.actionLabel}
        showAction={toastState.showAction}
        onClose={value.dismiss}
      />
    </FullScreenToastContext.Provider>
  );
}

export function FullScreenToast({
  open,
  variant = 'info',
  title,
  message,
  onClose,
  autoHideMs = 2200,
  actionLabel = 'OK',
  showAction = false
}: FullScreenToastProps) {
  useEffect(() => {
    if (!open || autoHideMs <= 0) return;
    const timer = setTimeout(() => onClose(), autoHideMs);
    return () => clearTimeout(timer);
  }, [open, autoHideMs, onClose]);

  if (!open) return null;

  const { icon, color, bg, accent } = variantMap[variant];
  const isError = variant === 'error';
  const isSuccess = variant === 'success';
  const overlayColor = isError ? 'rgba(220,38,38,0.95)' : 'rgba(37,99,235,0.98)';

  return (
    <Modal visible={open} transparent animationType="fade">
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: overlayColor,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 28
        }}
      >
        <Motion.View
          style={{
            width: '100%',
            alignItems: 'center'
          }}
          animate={isError ? { opacity: 1, x: 0 } : { opacity: 1, scale: 1 }}
          from={isError ? { opacity: 0, x: -6 } : { opacity: 0, scale: 0.94 }}
          transition={
            isError
              ? { duration: 0.12, repeat: 3, repeatType: 'mirror' }
              : { type: 'spring', stiffness: 260, damping: 16 }
          }
        >
          <VStack space="lg" className="items-center">
            <Box
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: bg, borderColor: accent, borderWidth: 1 }}
            >
              <MaterialIcons name={icon} size={34} color={color} />
            </Box>
            <Text size="xl" className="text-white text-center">
              {title}
            </Text>
            {message ? (
              <Text size="md" className="text-zinc-200 text-center">
                {message}
              </Text>
            ) : null}
            {showAction ? (
              <Button
                size="lg"
                action="primary"
                className="rounded-full mt-2 px-10"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
                onPress={onClose}
              >
                <ButtonText className="text-white">{actionLabel}</ButtonText>
              </Button>
            ) : null}
          </VStack>
        </Motion.View>
        {isSuccess ? (
          <Motion.View
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.18)'
            }}
            animate={{ opacity: 0.35, scale: 1.06 }}
            from={{ opacity: 0.15, scale: 0.9 }}
            transition={{ duration: 1.8, repeat: Infinity, repeatType: 'mirror' }}
          />
        ) : null}
      </Pressable>
    </Modal>
  );
}
