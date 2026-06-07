import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../ui/Button';

interface FreeRecallInputProps {
  prompt: string;
  onSubmit: (answer: string) => void;
}

export function FreeRecallInput({ prompt, onSubmit }: FreeRecallInputProps) {
  const [text, setText] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 px-6 pt-4">
        <Text className="text-base text-gray-500 mb-2 italic">Free Recall</Text>
        <Text className="text-lg font-semibold text-gray-900 mb-4">{prompt}</Text>
        <TextInput
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
          placeholder="Write everything you remember…"
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          value={text}
          onChangeText={setText}
          autoFocus
        />
        <View className="py-4">
          <Button
            title="Submit"
            onPress={() => onSubmit(text)}
            disabled={text.trim().length < 10}
            size="lg"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
