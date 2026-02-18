import React, { useMemo } from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { VStack } from "../ui/vstack";

type Props = {
  rows?: number;
};

export function FormSkeleton({ rows = 7 }: Props) {
  const heights = useMemo(
    () => [56, 56, 56, 72, 56, 56, 96].slice(0, rows),
    [rows],
  );

  return (
    <Animated.View entering={FadeIn.duration(150)}>
      <VStack className="px-5 pt-6" space="xl">
        {heights.map((h, idx) => (
          <View
            key={`form-skel-${idx}`}
            style={{
              height: h,
              borderRadius: 16,
              backgroundColor: "rgba(148,163,184,0.12)",
            }}
          />
        ))}
      </VStack>
    </Animated.View>
  );
}
