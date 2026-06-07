import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MindWanderResponse } from '../../types/app';

interface MindWanderPromptProps {
  visible: boolean;
  onRespond: (response: MindWanderResponse) => void;
}

const AUTO_DISMISS_MS = 4000;

export function MindWanderPrompt({ visible, onRespond }: MindWanderPromptProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timerRef.current = setTimeout(() => onRespond('timeout'), AUTO_DISMISS_MS);
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      className="absolute inset-0 justify-end pb-24 px-4"
      style={{ opacity }}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View className="bg-white/95 rounded-2xl p-5 shadow-lg">
        <Text className="text-sm font-semibold text-gray-700 mb-3 text-center">
          Pause — were you focused just now?
        </Text>
        <View className="gap-2">
          {([
            ['focused', 'Yes, fully focused', 'bg-green-50 border-green-200'],
            ['somewhat', 'Somewhat', 'bg-yellow-50 border-yellow-200'],
            ['wandered', 'My mind wandered', 'bg-red-50 border-red-200'],
          ] as [MindWanderResponse, string, string][]).map(([value, label, cls]) => (
            <TouchableOpacity
              key={value}
              onPress={() => onRespond(value)}
              className={`border rounded-xl py-3 items-center ${cls}`}
            >
              <Text className="text-sm font-medium text-gray-700">{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
