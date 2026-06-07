import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useStreak } from '../../hooks/useStreak';
import { useSRS, PassageRow } from '../../hooks/useSRS';
import { useReadingStore } from '../../stores/readingStore';
import { useProgressStore } from '../../stores/progressStore';
import { useQuizStore } from '../../stores/quizStore';
import { StreakFlame } from '../../components/ui/StreakFlame';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const DAILY_GOAL_SESSIONS = 3;

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const streak = useStreak();
  const { duePassages, nextPassage, loading } = useSRS();
  const startSession = useReadingStore((s) => s.startSession);
  const resetQuiz = useQuizStore((s) => s.reset);
  const [starting, setStarting] = useState(false);

  const todaySessionCount = 0;
  const dailyProgress = Math.min(1, todaySessionCount / DAILY_GOAL_SESSIONS);

  async function launchSession(passage: PassageRow) {
    setStarting(true);
    try {
      const { data: session, error } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: user!.id,
          passage_id: passage.id,
          is_review: duePassages.some((p) => p.id === passage.id),
        })
        .select()
        .single();

      if (error || !session) throw error;

      resetQuiz();
      startSession({
        sessionId: session.id,
        passageId: passage.id,
        title: passage.title,
        body: passage.body,
        wordCount: passage.word_count,
        difficulty: passage.difficulty,
      });

      router.push(`/reading/${session.id}`);
    } catch (err) {
      Alert.alert('Error', 'Could not start session. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  const passage = duePassages[0] ?? nextPassage;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-black text-gray-900">Get Smart</Text>
            <Text className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <StreakFlame streak={streak.currentStreak} size="md" />
        </View>

        <Card className="mb-4 flex-row items-center gap-4">
          <ProgressRing
            progress={dailyProgress}
            size={64}
            label={`${todaySessionCount}/${DAILY_GOAL_SESSIONS}`}
          />
          <View className="flex-1">
            <Text className="font-semibold text-gray-800">Daily Goal</Text>
            <Text className="text-sm text-gray-500">
              {todaySessionCount === 0
                ? 'Start your first session'
                : todaySessionCount < DAILY_GOAL_SESSIONS
                ? `${DAILY_GOAL_SESSIONS - todaySessionCount} more to go`
                : 'Daily goal complete! 🎉'}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-brand-600">{streak.totalXp}</Text>
            <Text className="text-xs text-gray-400">total XP</Text>
          </View>
        </Card>

        {duePassages.length > 0 && (
          <View className="mb-4">
            <Text className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-2">
              📅 Due for review ({duePassages.length})
            </Text>
            {duePassages.slice(0, 3).map((p) => (
              <Card key={p.id} className="mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="font-medium text-gray-800" numberOfLines={1}>{p.title}</Text>
                    <Text className="text-xs text-gray-400">{p.subject} · Level {p.difficulty}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => launchSession(p)}
                    className="bg-orange-100 rounded-lg px-3 py-1.5"
                  >
                    <Text className="text-xs font-semibold text-orange-600">Review</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Next Session
          </Text>
          {loading ? (
            <ActivityIndicator color="#6366f1" />
          ) : passage ? (
            <Card>
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-3">
                  <Text className="text-base font-semibold text-gray-900 mb-1">{passage.title}</Text>
                  <View className="flex-row gap-2">
                    <Text className="text-xs text-brand-500 font-medium">{passage.subject}</Text>
                    <Text className="text-xs text-gray-400">Level {passage.difficulty}</Text>
                    <Text className="text-xs text-gray-400">~{Math.ceil(passage.word_count / 200)} min</Text>
                  </View>
                  {passage.topics?.length > 0 && (
                    <View className="flex-row flex-wrap gap-1 mt-2">
                      {passage.topics.slice(0, 3).map((t) => (
                        <View key={t} className="bg-brand-50 rounded-full px-2 py-0.5">
                          <Text className="text-xs text-brand-600">{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <Button
                title="Start Reading"
                onPress={() => launchSession(passage)}
                loading={starting}
                size="lg"
              />
            </Card>
          ) : (
            <Card>
              <Text className="text-center text-gray-500">No passages available. Add some in Supabase!</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
