import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import {
  getLastCreatedJBExpoConfig,
  getSettingsConfig,
} from '../config';
import { JBMainLayout } from '../core';
import { Box, Card, HStack, Text, VStack } from '../ui';
import { useAppConfigStore } from '../runtime';
import { useJBSettingsSections } from './hooks';

export type JBSettingsScreenProps = {
  title?: string;
};

export const JBSettingsScreen = ({
  title = 'Configuración',
}: JBSettingsScreenProps) => {
  const router = useRouter();
  const baseConfig = getLastCreatedJBExpoConfig();
  const remoteConfig = useAppConfigStore((state: any) => state?.appConfig);
  const settingsConfig = getSettingsConfig({
    ...baseConfig,
    settings: {
      ...(baseConfig.settings ?? {}),
      ...(remoteConfig?.settings ?? {}),
    },
  } as any);

  const sections = useJBSettingsSections({
    onOpenNotifications: () => {
      const path = settingsConfig.notifications?.path ?? settingsConfig.routes?.notifications;
      router.push(path as any);
    },
    onOpenPermissions: () => {
      const path = settingsConfig.permissions?.path ?? settingsConfig.routes?.permissions;
      router.push(path as any);
    },
    onOpenSecurity: () => {
      const path = settingsConfig.security?.biometricsPath;
      if (!path) return;
      router.push(path as any);
    },
  });

  return (
    <>
      <Stack.Screen options={{ title }} />
      <JBMainLayout scrollable>
        <VStack className="flex-1 px-5 pt-4 pb-6" space="lg">
          {sections.map((section) => (
            <VStack key={section.id} space="sm">
              <Text
                size="sm"
                className="font-semibold text-typography-600 dark:text-typography-400"
              >
                {section.title}
              </Text>
              {section.id === 'appearance' ? (
                <Card className="w-full px-4 py-4">
                  <VStack space="sm">
                    <Text
                      size="xs"
                      className="text-typography-600 dark:text-typography-400"
                    >
                      Elige cómo quieres ver la interfaz.
                    </Text>
                    <Box className="flex-row flex-wrap">
                      {section.items.map((item) => (
                        <Box key={item.id} className="mb-2 mr-2">
                          <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={!item.onPress || item.disabled}
                            onPress={item.onPress}
                          >
                            <Box
                              className={`h-9 items-center justify-center rounded-full border px-4 ${
                                item.isActive
                                  ? 'border-primary-500 bg-primary-500'
                                  : 'border-outline-200 bg-background-100 dark:border-outline-700 dark:bg-background-900'
                              }`}
                            >
                              <Text
                                size="sm"
                                className={`font-semibold ${
                                  item.isActive
                                    ? 'text-white'
                                    : 'text-typography-700 dark:text-typography-200'
                                }`}
                              >
                                {item.title}
                              </Text>
                            </Box>
                          </TouchableOpacity>
                        </Box>
                      ))}
                    </Box>
                  </VStack>
                </Card>
              ) : (
                <VStack space="xs">
                  {section.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.9}
                      disabled={!item.onPress || item.disabled}
                      onPress={item.onPress}
                    >
                      <Card className="w-full px-4 py-3">
                        <HStack className="items-center justify-between" space="sm">
                          <VStack className="flex-1 pr-2" space="xs">
                            <HStack className="items-center" space="sm">
                              <Text
                                size="md"
                                className="font-semibold text-typography-black dark:text-typography-white"
                              >
                                {item.title}
                              </Text>
                              {item.badge ? (
                                <Box className="rounded-full bg-primary-500/15 px-2 py-1">
                                  <Text
                                    size="xs"
                                    className="font-semibold text-primary-600 dark:text-primary-300"
                                  >
                                    {item.badge}
                                  </Text>
                                </Box>
                              ) : null}
                            </HStack>
                            {item.subtitle ? (
                              <Text
                                size="xs"
                                className="text-typography-600 dark:text-typography-400"
                              >
                                {item.subtitle}
                              </Text>
                            ) : null}
                          </VStack>

                          <HStack className="items-center" space="xs">
                            {item.rightLabel ? (
                              <Text
                                size="xs"
                                className="font-semibold text-primary-600 dark:text-primary-300"
                              >
                                {item.rightLabel}
                              </Text>
                            ) : null}
                            <MaterialIcons
                              name="chevron-right"
                              size={20}
                              color="#94a3b8"
                            />
                          </HStack>
                        </HStack>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </VStack>
              )}
            </VStack>
          ))}
        </VStack>
      </JBMainLayout>
    </>
  );
};
