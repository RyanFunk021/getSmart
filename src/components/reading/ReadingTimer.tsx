import React, { useEffect, useState, useRef } from 'react';
import { View, Text } from 'react-native';

interface ReadingTimerProps {
  startedAt: number;
  limitMinutes: number;
}

export function ReadingTimer({ startedAt, limitMinutes }: ReadingTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt]);

  const elapsedMin = Math.floor(elapsedMs / 60000);
  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
  const timeStr = `${elapsedMin}:${String(elapsedSec).padStart(2, '0')}`;
  const progress = limitMinutes > 0 ? Math.min(1, elapsedMs / (limitMinutes * 60000)) : 0;

  return (
    <View className="px-4 pt-2">
      {limitMinutes > 0 && (
        <View className="h-1 bg-gray-200 rounded-full mb-1">
          <View
            className="h-1 bg-brand-400 rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
      )}
      <Text className="text-xs text-gray-400 text-right">{timeStr}</Text>
    </View>
  );
}
