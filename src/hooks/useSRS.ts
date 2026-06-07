import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';

export interface PassageRow {
  id: string;
  title: string;
  body: string;
  word_count: number;
  subject: string;
  difficulty: number;
  topics: string[];
}

export function useSRS() {
  const user = useAuthStore((s) => s.user);
  const userLevel = useProgressStore((s) => s.userLevel);
  const [duePassages, setDuePassages] = useState<PassageRow[]>([]);
  const [nextPassage, setNextPassage] = useState<PassageRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadQueue();
  }, [user, userLevel]);

  async function loadQueue() {
    if (!user) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const { data: srsData } = await supabase
      .from('srs_cards')
      .select('passage_id, due_date, passages(*)')
      .eq('user_id', user.id)
      .lte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(5);

    const due = (srsData ?? []).map((row: any) => row.passages as PassageRow).filter(Boolean);
    setDuePassages(due);

    if (due.length === 0) {
      const { data: readIds } = await supabase
        .from('reading_sessions')
        .select('passage_id')
        .eq('user_id', user.id);

      const excludeIds = (readIds ?? []).map((r: any) => r.passage_id);

      let query = supabase
        .from('passages')
        .select('*')
        .eq('difficulty', userLevel)
        .limit(1);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data: newPassage } = await query.single();
      setNextPassage(newPassage as PassageRow | null);
    }

    setLoading(false);
  }

  return { duePassages, nextPassage, loading, refetch: loadQueue };
}
