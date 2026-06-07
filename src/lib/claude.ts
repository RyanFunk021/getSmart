import { supabase } from './supabase';
import { PassageAICache } from '../types/app';

export async function generateQuestions(passageId: string): Promise<PassageAICache> {
  const { data, error } = await supabase.functions.invoke('generate-questions', {
    body: { passage_id: passageId },
  });
  if (error) throw error;
  return data as PassageAICache;
}

export async function gradeShortAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string,
  passageContext: string
): Promise<{ score: number; feedback: string }> {
  const { data, error } = await supabase.functions.invoke('grade-answer', {
    body: { question, correct_answer: correctAnswer, user_answer: userAnswer, passage_context: passageContext },
  });
  if (error) throw error;
  return data as { score: number; feedback: string };
}
