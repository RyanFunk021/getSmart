import React from 'react';
import { View, Text, ScrollView } from 'react-native';

interface DayData {
  date: string;
  xp: number;
}

interface HeatmapCalendarProps {
  data: DayData[];
  weeks?: number;
}

function intensity(xp: number): string {
  if (xp === 0) return 'bg-gray-100';
  if (xp < 50) return 'bg-brand-100';
  if (xp < 100) return 'bg-brand-200';
  if (xp < 200) return 'bg-brand-400';
  return 'bg-brand-600';
}

const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];

export function HeatmapCalendar({ data, weeks = 13 }: HeatmapCalendarProps) {
  const dataMap = new Map(data.map((d) => [d.date, d.xp]));
  const today = new Date();
  const days: { date: string; xp: number }[] = [];

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, xp: dataMap.get(key) ?? 0 });
  }

  const grid: { date: string; xp: number }[][] = [];
  for (let w = 0; w < weeks; w++) {
    grid.push(days.slice(w * 7, w * 7 + 7));
  }

  return (
    <View>
      <View className="flex-row mb-1">
        <View className="w-4" />
        {DAY_LABELS.map((l, i) => (
          <Text key={i} className="text-xs text-gray-400 w-5 text-center">
            {l}
          </Text>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1">
          {grid.map((week, wi) => (
            <View key={wi} className="gap-1">
              {week.map((day, di) => (
                <View
                  key={di}
                  className={`w-4 h-4 rounded-sm ${intensity(day.xp)}`}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
