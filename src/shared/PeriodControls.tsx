// @ts-nocheck
import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, TouchableOpacity } from 'react-native';

import { Box } from '../ui/box';
import { HStack } from '../ui/hstack';
import { Text } from '../ui/text';

type PeriodMode = 'weekly' | 'monthly' | 'yearly';

type Props = {
  mode: PeriodMode;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  opacity?: Animated.Value;
  bottomOffset?: number;
};

const AnimatedHStack = Animated.createAnimatedComponent(HStack);

export function PeriodControls({
  mode: _mode,
  label,
  onPrev,
  onNext,
  opacity,
  bottomOffset = 12
}: Props) {
  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeFeedback = useRef(new Animated.Value(0)).current;
  const [swipeDir, setSwipeDir] = useState<'prev' | 'next' | null>(null);
  const onPrevRef = useRef(onPrev);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onPrevRef.current = onPrev;
    onNextRef.current = onNext;
  }, [onPrev, onNext]);

  const triggerFeedback = (dir: 'prev' | 'next') => {
    setSwipeDir(dir);
    swipeFeedback.setValue(0);
    Animated.sequence([
      Animated.timing(swipeFeedback, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true
      }),
      Animated.timing(swipeFeedback, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      })
    ]).start(() => setSwipeDir(null));
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: Animated.event([null, { dx: swipeX }], {
        useNativeDriver: false
      }),
      onPanResponderRelease: (_, gesture) => {
        swipeX.setValue(0);
        if (gesture.dx > 40) {
          triggerFeedback('prev');
          onPrevRef.current();
        } else if (gesture.dx < -40) {
          triggerFeedback('next');
          onNextRef.current();
        }
      },
      onPanResponderTerminate: () => {
        swipeX.setValue(0);
      }
    })
  ).current;

  const swipeTranslate = swipeX.interpolate({
    inputRange: [-80, 80],
    outputRange: [-8, 8],
    extrapolate: 'clamp'
  });

  const feedbackScale = swipeFeedback.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1]
  });

  return (
    <Box
      className="absolute left-0 w-full items-center z-20"
      style={{ bottom: bottomOffset }}
    >
      <AnimatedHStack
        {...panResponder.panHandlers}
        style={{
          opacity: opacity ?? 1,
          transform: [{ translateX: swipeTranslate }]
        }}
        className="bg-primary-500 dark:bg-background-950 w-[90%] h-12 rounded-xl items-center justify-between relative"
      >
        {swipeDir ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '30%',
              left: swipeDir === 'prev' ? 0 : undefined,
              right: swipeDir === 'next' ? 0 : undefined,
              backgroundColor: 'rgba(255,255,255,0.14)',
              borderRadius: 12,
              opacity: swipeFeedback,
              transform: [{ scaleX: feedbackScale }]
            }}
          />
        ) : null}

        <TouchableOpacity
          className="w-[25%] h-full items-center justify-center"
          onPress={onPrev}
          activeOpacity={0.7}
        >
          <FontAwesome name="chevron-left" color="white" size={20} />
        </TouchableOpacity>

        <Box className="w-[50%] h-full items-center justify-center">
          <Text className="text-white text-center" size="2xl">
            {label}
          </Text>
        </Box>

        <TouchableOpacity
          className="w-[25%] h-full items-center justify-center"
          onPress={onNext}
          activeOpacity={0.7}
        >
          <FontAwesome name="chevron-right" color="white" size={20} />
        </TouchableOpacity>
      </AnimatedHStack>
    </Box>
  );
}
