import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useReadingStore } from '../../stores/readingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useReadingSession } from '../../hooks/useReadingSession';
import { PassageText } from '../../components/reading/PassageText';
import { ReadingTimer } from '../../components/reading/ReadingTimer';
import { MindWanderPrompt } from '../../components/reading/MindWanderPrompt';
import { Button } from '../../components/ui/Button';
import { MindWanderResponse } from '../../types/app';

export default function ReadingScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const {
    passageTitle,
    passageBody,
    passageId,
    passageDifficulty,
    wordCount,
    startedAt,
    endReading,
    setScrollProgress,
    mindWanderEvents,
  } = useReadingStore();
  const sessionLengthMinutes = useSettingsStore((s) => s.sessionLengthMinutes);

  const [pingVisible, setPingVisible] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scrolledEnough, setScrolledEnough] = useState(false);

  const { registerPingCallback, recordMindWander } = useReadingSession(() => {
    setShowLimitAlert(true);
  });

  registerPingCallback(() => setPingVisible(true));

  function handleScrollProgress(progress: number) {
    setScrollProgress(progress);
    if (progress > 0.7) setScrolledEnough(true);
  }

  function handleMindWander(response: MindWanderResponse) {
    setPingVisible(false);
    recordMindWander(response);
  }

  async function handleFinishedReading() {
    setSaving(true);
    endReading();
    const readingDurationMs = startedAt ? Date.now() - startedAt : 0;
    const wpm = readingDurationMs > 0 ? Math.round((wordCount / readingDurationMs) * 60000) : 0;

    await supabase.from('reading_sessions').update({
      reading_ended_at: new Date().toISOString(),
      reading_duration_ms: readingDurationMs,
      wpm,
      mind_wander_count: mindWanderEvents.filter((e) => e.response === 'wandered').length,
    }).eq('id', sessionId);

    setSaving(false);
    router.push(`/quiz/${sessionId}`);
  }

  function handleAbandon() {
    Alert.alert('Abandon session?', 'You won\'t get a score, but the passage stays in your queue.', [
      { text: 'Keep reading' },
      { text: 'Abandon', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (!passageBody) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Loading passage…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
        <TouchableOpacity onPress={handleAbandon} className="p-2">
          <Text className="text-gray-400 text-lg">✕</Text>
        </TouchableOpacity>
        <Text className="text-sm font-medium text-gray-500" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
          {passageTitle}
        </Text>
        <View className="w-8" />
      </View>

      {startedAt && (
        <ReadingTimer startedAt={startedAt} limitMinutes={sessionLengthMinutes} />
      )}

      <PassageText
        title={passageTitle}
        body={passageBody}
        subject=""
        difficulty={passageDifficulty}
        onScrollProgress={handleScrollProgress}
      />

      <View className="px-6 pb-6 pt-2">
        <Button
          title="I've finished reading"
          onPress={handleFinishedReading}
          disabled={!scrolledEnough}
          loading={saving}
          size="lg"
        />
        {!scrolledEnough && (
          <Text className="text-xs text-gray-400 text-center mt-2">
            Read to near the end to continue
          </Text>
        )}
      </View>

      <MindWanderPrompt visible={pingVisible} onRespond={handleMindWander} />

      <Modal visible={showLimitAlert} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">Session limit reached</Text>
            <Text className="text-gray-500 mb-4">
              You've hit your {sessionLengthMinutes}-minute limit. Keep reading or stop here.
            </Text>
            <Button title="Keep reading" onPress={() => setShowLimitAlert(false)} className="mb-3" />
            <Button
              title="Stop here"
              onPress={() => { setShowLimitAlert(false); handleAbandon(); }}
              variant="ghost"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
