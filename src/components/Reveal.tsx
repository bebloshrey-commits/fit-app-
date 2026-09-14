import React, { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";
export function Reveal({ children }: { children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active || reduced) return;
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      active = false;
      progress.stopAnimation();
    };
  }, [progress]);
  return (
    <Animated.View
      style={{
        gap: 18,
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
