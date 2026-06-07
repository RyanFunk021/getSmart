import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Question } from '../../types/app';
import { Button } from '../ui/Button';

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  onSubmit: (answer: string) => void;
}

export function QuestionCard({ question, index, total, onSubmit }: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState('');

  const isMultipleChoice = question.type === 'multiple_choice';
  const isShortAnswer = question.type === 'short_answer' || question.type === 'inference';
  const canSubmit = isMultipleChoice ? selected !== null : shortAnswer.trim().length > 5;

  function handleSubmit() {
    if (isMultipleChoice) onSubmit(selected!);
    else onSubmit(shortAnswer.trim());
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xs font-medium text-brand-500 uppercase tracking-wide">
            {question.type.replace('_', ' ')}
          </Text>
          <Text className="text-xs text-gray-400">
            {index + 1} of {total}
          </Text>
        </View>

        <Text className="text-lg font-semibold text-gray-900 mb-6">{question.question}</Text>

        {isMultipleChoice && question.options && (
          <View className="gap-3">
            {question.options.map((option, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setSelected(option)}
                className={`border rounded-xl p-4 ${
                  selected === option
                    ? 'bg-brand-50 border-brand-400'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text
                  className={`text-base ${
                    selected === option ? 'text-brand-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isShortAnswer && (
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900 min-h-24"
            placeholder="Your answer…"
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
            value={shortAnswer}
            onChangeText={setShortAnswer}
          />
        )}

        <View className="mt-auto py-4">
          <Button
            title="Submit Answer"
            onPress={handleSubmit}
            disabled={!canSubmit}
            size="lg"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
