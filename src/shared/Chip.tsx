import * as Haptics from "expo-haptics";
import React from "react";
import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";

import { getLastCreatedJBExpoConfig, resolveJBUIColor } from "../config";
import { useColorScheme } from "../hooks";
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";

type ChipProps = {
  title: string;
  subtitle?: string | null;
  icon?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  pressable?: boolean;
  onPress?: () => void;
  isActive?: boolean;
  activeBgClassName?: string;
  inactiveBgClassName?: string;
  style?: StyleProp<ViewStyle>;
};

export const Chip = ({
  title,
  subtitle = null,
  icon = null,
  titleClassName = "",
  className = "",
  onPress = () => {},
  pressable = true,
  isActive = false,
  activeBgClassName = "bg-primary-500",
  inactiveBgClassName = "bg-slate-500",
  style = {},
}: ChipProps) => {
  const colorScheme = useColorScheme();
  const config = getLastCreatedJBExpoConfig();
  const chipConfig = config?.ui?.chip;
  const chipStateConfig = isActive ? chipConfig?.active : chipConfig?.inactive;
  const resolvedBackgroundColor = resolveJBUIColor(
    chipStateConfig?.backgroundColor,
    colorScheme,
  );
  const resolvedBorderColor = resolveJBUIColor(
    chipStateConfig?.borderColor,
    colorScheme,
  );
  const resolvedTextColor = resolveJBUIColor(
    chipStateConfig?.textColor,
    colorScheme,
  );

  const _renderChip = () => (
    <Box
      className={`h-[27px] justify-center items-center flex-row px-3 rounded-xl ${
        isActive ? activeBgClassName : inactiveBgClassName
      } ${className}`}
      style={[
        style,
        resolvedBackgroundColor ? { backgroundColor: resolvedBackgroundColor } : null,
        resolvedBorderColor ? { borderColor: resolvedBorderColor, borderWidth: 1 } : null,
      ]}
    >
      {icon}
      <VStack>
        <Text
          className={`${titleClassName} ${icon ? "ml-3" : ""}`}
          size="lg"
          style={resolvedTextColor ? { color: resolvedTextColor } : undefined}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className={`${titleClassName} ${icon ? "ml-3" : ""}`}
            size="lg"
            style={resolvedTextColor ? { color: resolvedTextColor } : undefined}
          >
            {subtitle}
          </Text>
        ) : null}
      </VStack>
    </Box>
  );

  if (!pressable) {
    return _renderChip();
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => {
        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
    >
      {_renderChip()}
    </TouchableOpacity>
  );
};
