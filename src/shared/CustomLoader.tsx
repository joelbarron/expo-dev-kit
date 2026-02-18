// @ts-nocheck
import { Motion } from "@legendapp/motion";
import React from "react";
import { StyleSheet } from "react-native";

type Props = {
  size?: number;
  color?: string;
  thickness?: number;
  gap?: number;
};

export function CustomLoader({
  size = 24,
  color = "#4F46E5",
  thickness = 4,
}: Props) {
  return (
    <Motion.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: `${color}33`,
          borderTopColor: color,
        },
      ]}
      animate={{ rotate: "360deg" }}
      transition={{
        duration: 0.9,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
      }}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: "center",
    justifyContent: "center",
  },
});
