import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Grade } from '../../types/app';

interface ScoreBadgeProps {
  grade: Grade;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const gradeColors: Record<Grade, string> = {
  S: 'bg-yellow-400',
  A: 'bg-accent-green',
  B: 'bg-brand-500',
  C: 'bg-orange-400',
  D: 'bg-accent-red',
};

const gradeTextColors: Record<Grade, string> = {
  S: 'text-yellow-900',
  A: 'text-green-900',
  B: 'text-white',
  C: 'text-orange-900',
  D: 'text-white',
};

const sizePx = { sm: 40, md: 56, lg: 80 };
const textSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };

export function ScoreBadge({ grade, size = 'md', animate = false }: ScoreBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(animate ? 0 : 1)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [animate]);

  const px = sizePx[size];

  return (
    <Animated.View
      className={`${gradeColors[grade]} items-center justify-center rounded-full`}
      style={{ width: px, height: px, transform: [{ scale: scaleAnim }] }}
    >
      <Text className={`${textSizes[size]} font-black ${gradeTextColors[grade]}`}>{grade}</Text>
    </Animated.View>
  );
}
