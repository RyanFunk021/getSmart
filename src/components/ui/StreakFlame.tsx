import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

interface StreakFlameProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const sizes = { sm: 24, md: 36, lg: 48 };
const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };

export function StreakFlame({ streak, size = 'md', animate = false }: StreakFlameProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate || streak === 0) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [streak, animate]);

  const flameSize = sizes[size];

  return (
    <View className="items-center">
      <Animated.Text
        style={[{ fontSize: flameSize, transform: [{ scale: scaleAnim }] }]}
      >
        🔥
      </Animated.Text>
      <Text className={`${textSizes[size]} font-bold text-accent-orange`}>{streak}</Text>
    </View>
  );
}
