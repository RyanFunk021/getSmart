import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useStreak } from '../../hooks/useStreak';
import { useProgressStore } from '../../stores/progressStore';
import { Card } from '../../components/ui/Card';
import { StreakFlame } from '../../components/ui/StreakFlame';
import { HeatmapCalendar } from '../../components/progress/HeatmapCalendar';
import { SkillRadar } from '../../components/progress/SkillRadar';

interface DayXp { date: string; xp: number }

export default function ProgressScreen() {
  const user = useAuthStore((s) => s.user);
  const streak = useStreak();
  const userLevel = useProgressStore((s) => s.userLevel);
  const [heatmapData, setHeatmapData] = useState<DayXp[]>([]);
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    const [heatmap, attempts, due] = await Promise.all([
      supabase
        .from('session_scores')
        .select('scored_at, xp_earned')
        .eq('user_id', user.id)
        .gte('scored_at', new Date(Date.now() - 90 * 24 * 3600000).toISOString()),
      supabase
        .from('quiz_attempts')
        .select('question_snapshot, is_correct')
        .eq('user_id', user.id),
      supabase
        .from('srs_cards')
        .select('id')
        .eq('user_id', user.id)
        .lte('due_date', today),
    ]);

    if (heatmap.data) {
      const byDay = new Map<string, number>();
      for (const row of heatmap.data) {
        const date = row.scored_at.split('T')[0];
        byDay.set(date, (byDay.get(date) ?? 0) + row.xp_earned);
      }
      setHeatmapData(Array.from(byDay.entries()).map(([date, xp]) => ({ date, xp })));
    }

    if (attempts.data) {
      const conceptTotals: Record<string, { correct: number; total: number }> = {};
      for (const attempt of attempts.data) {
        const tags: string[] = attempt.question_snapshot?.concept_tags ?? [];
        for (const tag of tags) {
          if (!conceptTotals[tag]) conceptTotals[tag] = { correct: 0, total: 0 };
          conceptTotals[tag].total++;
          if (attempt.is_correct) conceptTotals[tag].correct++;
        }
      }
      const skillMap: Record<string, number> = {};
      for (const [tag, { correct, total }] of Object.entries(conceptTotals)) {
        skillMap[tag] = total > 0 ? Math.round((correct / total) * 100) : 0;
      }
      setSkills(skillMap);
    }

    setDueCount(due.data?.length ?? 0);
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-black text-gray-900 mb-6">Progress</Text>

        <Card className="mb-4 flex-row items-center justify-around py-4">
          <View className="items-center">
            <StreakFlame streak={streak.currentStreak} size="lg" />
            <Text className="text-xs text-gray-400 mt-1">streak</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-black text-brand-600">{streak.totalXp}</Text>
            <Text className="text-xs text-gray-400">total XP</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-black text-gray-800">{streak.totalSessions}</Text>
            <Text className="text-xs text-gray-400">sessions</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-black text-purple-600">Lv.{userLevel}</Text>
            <Text className="text-xs text-gray-400">level</Text>
          </View>
        </Card>

        {dueCount > 0 && (
          <Card className="mb-4 flex-row items-center gap-3 bg-orange-50">
            <Text className="text-2xl">📅</Text>
            <Text className="flex-1 text-sm font-medium text-orange-700">
              {dueCount} passage{dueCount > 1 ? 's' : ''} due for review today
            </Text>
          </Card>
        )}

        <Card className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Activity (90 days)</Text>
          {loading ? (
            <ActivityIndicator color="#6366f1" />
          ) : (
            <HeatmapCalendar data={heatmapData} />
          )}
        </Card>

        <Card className="mb-4 items-center">
          <Text className="text-sm font-semibold text-gray-700 mb-3 self-start">Skill Profile</Text>
          {loading ? (
            <ActivityIndicator color="#6366f1" />
          ) : Object.keys(skills).length > 0 ? (
            <SkillRadar skills={skills} />
          ) : (
            <Text className="text-gray-400 text-sm py-4">
              Complete sessions to see your skill profile
            </Text>
          )}
        </Card>

        {streak.longestStreak > 0 && (
          <Card>
            <Text className="text-xs text-gray-500">Personal best streak</Text>
            <Text className="text-3xl font-black text-orange-500">{streak.longestStreak} days 🔥</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
