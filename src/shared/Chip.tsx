// @ts-nocheck
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import * as Haptics from "expo-haptics";
import React from "react";
import { TouchableOpacity } from "react-native";
import { VStack } from "../ui/vstack";

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
}: {
  title: string;
  subtitle?: string | null;
  icon?: any;
  className?: string;
  titleClassName?: string;
  pressable?: boolean;
  onPress?: () => void;
  isActive?: boolean;
  activeBgClassName?: string;
  inactiveBgClassName?: string;
  style?: any;
}) => {
  const _renderChip = () => (
    <Box
      className={`h-[27px] justify-center items-center flex-row  px-3 rounded-xl ${className} ${
        isActive ? activeBgClassName : inactiveBgClassName
      }`}
      style={style}
    >
      {/* <FontAwesome name={iconName} color="zinc" size={25} /> */}
      {icon}
      <VStack>
        <Text className={`${titleClassName} ${icon ? "ml-3" : ""}`} size="lg">
          {title}
        </Text>
        {subtitle && (
          <Text className={`${titleClassName} ${icon ? "ml-3" : ""}`} size="lg">
            {subtitle}
          </Text>
        )}
      </VStack>
    </Box>
  );

  if (!pressable) {
    return _renderChip();
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        // props.onPressIn?.(ev);
      }}
    >
      {_renderChip()}
    </TouchableOpacity>
  );
};
