import { useEffect } from 'react';
import { useQuizStore } from '../stores/quizStore';
import { generateQuestions } from '../lib/claude';
import { supabase } from '../lib/supabase';

export function useQuizSession(passageId: string, sessionId: string) {
  const { cache, loading, setCache, setLoading } = useQuizStore();

  useEffect(() => {
    if (cache) return;
    loadQuestions();
  }, [passageId]);

  async function loadQuestions() {
    setLoading(true);
    try {
      const { data: cached } = await supabase
        .from('passage_ai_cache')
        .select('*')
        .eq('passage_id', passageId)
        .single();

      if (cached) {
        setCache({
          free_recall_prompt: cached.questions.free_recall_prompt,
          questions: cached.questions.questions,
          concept_map: cached.concept_map,
          topics: cached.questions.topics ?? [],
        });
      } else {
        const result = await generateQuestions(passageId);
        setCache(result);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  }

  return { cache, loading };
}
