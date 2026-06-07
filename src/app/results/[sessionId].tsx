import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useReadingStore } from '../../stores/readingStore';
import { useQuizStore } from '../../stores/quizStore';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConceptGraph } from '../../components/progress/ConceptGraph';
import { mindWanderSummary } from '../../lib/attention';
import { Grade, SessionScoreResult } from '../../types/app';

export default function ResultsScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const mindWanderEvents = useReadingStore((s) => s.mindWanderEvents);
  const cache = useQuizStore((s) => s.cache);
  const resetReading = useReadingStore((s) => s.reset);
  const resetQuiz = useQuizStore((s) => s.reset);

  const [score, setScore] = useState<SessionScoreResult | null>(null);
  const [loading, setLoading] = useState(true);

  const xpAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const [displayXp, setDisplayXp] = useState(0);

  useEffect(() => {
    supabase
      .from('session_scores')
      .select('*')
      .eq('session_id', sessionId)
      .single()
      .then(({ data }) => {
        if (data) {
          const s: SessionScoreResult = {
            rawScore: data.raw_score,
            maxScore: data.max_score,
            pctCorrect: data.pct_correct,
            speedBonus: data.speed_bonus,
            streakBonus: data.streak_bonus,
            xpEarned: data.xp_earned,
            grade: data.grade as Grade,
          };
          setScore(s);
          setLoading(false);

          Haptics.notificationAsync(
            s.grade === 'S' || s.grade === 'A'
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Warning
          );

          Animated.timing(scoreAnim, {
            toValue: s.rawScore,
            duration: 1200,
            useNativeDriver: false,
          }).start();
          scoreAnim.addListener(({ value }) => setDisplayScore(Math.floor(value)));

          Animated.timing(xpAnim, {
            toValue: s.xpEarned,
            duration: 1400,
            useNativeDriver: false,
          }).start();
          xpAnim.addListener(({ value }) => setDisplayXp(Math.floor(value)));
        }
      });

    return () => {
      scoreAnim.removeAllListeners();
      xpAnim.removeAllListeners();
    };
  }, [sessionId]);

  const { highWander } = mindWanderSummary(mindWanderEvents);

  function handleDone() {
    resetReading();
    resetQuiz();
    router.replace('/(tabs)/home');
  }

  if (loading || !score) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-400">Loading results…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View className="items-center mb-8">
          <Text className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
            Session Complete
          </Text>
          <ScoreBadge grade={score.grade} size="lg" animate />
          <Text className="text-5xl font-black text-gray-900 mt-6">{displayScore}</Text>
          <Text className="text-sm text-gray-400">out of {score.maxScore} points</Text>
        </View>

        <Card className="mb-4">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-brand-600">+{displayXp}</Text>
              <Text className="text-xs text-gray-400">XP earned</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-accent-green">
                {Math.round(score.pctCorrect * 100)}%
              </Text>
              <Text className="text-xs text-gray-400">accuracy</Text>
            </View>
            {score.speedBonus > 0 && (
              <View className="items-center">
                <Text className="text-2xl font-bold text-yellow-500">+{score.speedBonus}</Text>
                <Text className="text-xs text-gray-400">speed bonus</Text>
              </View>
            )}
            {score.streakBonus > 0 && (
              <View className="items-center">
                <Text className="text-2xl font-bold text-orange-500">+{score.streakBonus}</Text>
                <Text className="text-xs text-gray-400">streak bonus</Text>
              </View>
            )}
          </View>
        </Card>

        {highWander && (
          <Card className="mb-4 bg-yellow-50 border border-yellow-200">
            <Text className="text-sm font-medium text-yellow-800">
              💭 Your mind wandered a lot this session. Consider shorter sessions or a quieter environment.
            </Text>
          </Card>
        )}

        {cache?.concept_map && (
          <Card className="mb-4 items-center">
            <Text className="text-sm font-semibold text-gray-700 mb-3 self-start">
              Concept Map
            </Text>
            <ConceptGraph conceptMap={cache.concept_map} size={280} />
          </Card>
        )}

        <Card className="mb-6 bg-brand-50">
          <Text className="text-sm text-brand-700">
            📅 This passage is scheduled for review based on your score. It'll resurface at the right time.
          </Text>
        </Card>

        <Button title="Back to Home" onPress={handleDone} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}
