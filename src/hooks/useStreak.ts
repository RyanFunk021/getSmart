import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';

export function useStreak() {
  const user = useAuthStore((s) => s.user);
  const setStreak = useProgressStore((s) => s.setStreak);
  const streak = useProgressStore((s) => s.streak);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setStreak({
            currentStreak: data.current_streak,
            longestStreak: data.longest_streak,
            lastSessionDate: data.last_session_date,
            totalSessions: data.total_sessions,
            totalXp: data.total_xp,
            freezeTokens: data.freeze_tokens_available ?? 1,
          });
        }
      });
  }, [user]);

  return streak;
}

export async function updateStreakAfterSession(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data: current } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = 1;
  if (current) {
    if (current.last_session_date === today) {
      return;
    } else if (current.last_session_date === yesterdayStr) {
      newStreak = current.current_streak + 1;
    }
  }

  await supabase.from('user_streaks').upsert({
    user_id: userId,
    current_streak: newStreak,
    longest_streak: Math.max(newStreak, current?.longest_streak ?? 0),
    last_session_date: today,
    total_sessions: (current?.total_sessions ?? 0) + 1,
    freeze_tokens_available: current?.freeze_tokens_available ?? 1,
    updated_at: new Date().toISOString(),
  });
}
