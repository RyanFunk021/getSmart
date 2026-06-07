import React from 'react';
import { ScrollView, Text, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';

interface PassageTextProps {
  title: string;
  body: string;
  subject: string;
  difficulty: number;
  onScrollProgress: (progress: number) => void;
}

const fontSizeMap = { small: 15, medium: 18, large: 22 };
const lineHeightMap = { small: 24, medium: 28, large: 34 };

export function PassageText({ title, body, subject, difficulty, onScrollProgress }: PassageTextProps) {
  const fontSize = useSettingsStore((s) => s.fontSize);
  const textSize = fontSizeMap[fontSize];
  const lineHeight = lineHeightMap[fontSize];

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    if (scrollable > 0) {
      onScrollProgress(Math.min(1, contentOffset.y / scrollable));
    }
  }

  return (
    <ScrollView
      className="flex-1 px-6"
      onScroll={handleScroll}
      scrollEventThrottle={500}
      showsVerticalScrollIndicator={false}
    >
      <View className="pt-4 pb-2 flex-row items-center gap-2">
        <Text className="text-xs font-medium text-brand-500 uppercase tracking-wide">{subject}</Text>
        <View className="bg-gray-200 rounded-full px-2 py-0.5">
          <Text className="text-xs text-gray-500">Level {difficulty}</Text>
        </View>
      </View>

      <Text className="text-2xl font-bold text-gray-900 mb-6" style={{ lineHeight: 34 }}>
        {title}
      </Text>

      {body.split('\n\n').map((paragraph, i) => (
        <Text
          key={i}
          className="text-gray-800 mb-5"
          style={{ fontSize: textSize, lineHeight }}
        >
          {paragraph.trim()}
        </Text>
      ))}

      <View className="h-16" />
    </ScrollView>
  );
}
