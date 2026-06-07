import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Question } from '../../types/app';

interface FeedbackOverlayProps {
  visible: boolean;
  isCorrect: boolean;
  question: Question;
  userAnswer: string;
  onContinue: () => void;
}

export function FeedbackOverlay({
  visible,
  isCorrect,
  question,
  userAnswer,
  onContinue,
}: FeedbackOverlayProps) {
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(
        isCorrect ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
      );
      Animated.spring(translateY, {
        toValue: 0,
        tension: 70,
        friction: 9,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, { toValue: 300, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      className="absolute bottom-0 left-0 right-0"
      style={{ transform: [{ translateY }] }}
    >
      <View className={`rounded-t-3xl p-6 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
        <View className="flex-row items-center gap-3 mb-3">
          <Text className="text-2xl">{isCorrect ? '✅' : '❌'}</Text>
          <Text
            className={`text-lg font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}
          >
            {isCorrect ? 'Correct!' : 'Not quite'}
          </Text>
        </View>

        {!isCorrect && (
          <View className="bg-white/70 rounded-xl p-3 mb-3">
            <Text className="text-xs text-gray-500 mb-1">Correct answer</Text>
            <Text className="text-sm font-medium text-gray-800">{question.correct_answer}</Text>
          </View>
        )}

        <Text className="text-sm text-gray-700 mb-4">{question.explanation}</Text>

        {question.passage_evidence && (
          <View className="bg-white/60 rounded-xl p-3 mb-4 border-l-4 border-brand-300">
            <Text className="text-xs text-gray-500 mb-1">From the passage</Text>
            <Text className="text-sm italic text-gray-700">"{question.passage_evidence}"</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={onContinue}
          className={`rounded-xl py-4 items-center ${isCorrect ? 'bg-green-500' : 'bg-brand-500'}`}
        >
          <Text className="text-white font-semibold text-base">Continue</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
