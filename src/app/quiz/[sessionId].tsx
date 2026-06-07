import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useReadingStore } from '../../stores/readingStore';
import { useQuizStore } from '../../stores/quizStore';
import { useProgressStore } from '../../stores/progressStore';
import { useQuizSession } from '../../hooks/useQuizSession';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { FreeRecallInput } from '../../components/quiz/FreeRecallInput';
import { FeedbackOverlay } from '../../components/quiz/FeedbackOverlay';
import { calculateScore } from '../../lib/scoring';
import { sm2Update, pctToQuality, defaultCard } from '../../lib/srs';
import { updateStreakAfterSession } from '../../hooks/useStreak';
import { Question } from '../../types/app';

export default function QuizScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const user = useAuthStore((s) => s.user);
  const { passageId, passageDifficulty, wpm } = useReadingStore();
  const { cache, loading, currentIndex, answers, nextQuestion, submitAnswer } = useQuizStore();
  const streak = useProgressStore((s) => s.streak);
  const { cache: _cache } = useQuizSession(passageId!, sessionId);

  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [lastAnswer, setLastAnswer] = useState({ answer: '', isCorrect: false, question: null as Question | null });
  const [submitting, setSubmitting] = useState(false);

  if (loading || !cache) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-gray-500">Generating your questions…</Text>
      </SafeAreaView>
    );
  }

  const allQuestions = cache.questions;
  const isFreeRecall = currentIndex === 0;
  const currentQuestion = isFreeRecall ? null : allQuestions[currentIndex - 1];
  const isFinished = currentIndex > allQuestions.length;

  function handleFreeRecallSubmit(answer: string) {
    submitAnswer({ questionIndex: 0, userAnswer: answer, isCorrect: true, scoreDelta: 10 });
    nextQuestion();
  }

  async function handleQuestionSubmit(answer: string) {
    if (!currentQuestion || submitting) return;
    const isCorrect = answer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim()
      || (currentQuestion.type === 'multiple_choice' && answer === currentQuestion.correct_answer);

    const scoreDelta = isCorrect ? 20 : 0;

    setLastAnswer({ answer, isCorrect, question: currentQuestion });
    setFeedbackVisible(true);

    submitAnswer({ questionIndex: currentIndex, userAnswer: answer, isCorrect, scoreDelta });

    await supabase.from('quiz_attempts').insert({
      session_id: sessionId,
      user_id: user!.id,
      question_index: currentIndex,
      question_snapshot: currentQuestion,
      user_answer: answer,
      is_correct: isCorrect,
      score_delta: scoreDelta,
    });
  }

  async function handleContinue() {
    setFeedbackVisible(false);

    if (currentIndex >= allQuestions.length) {
      await finalizeSession();
    } else {
      nextQuestion();
    }
  }

  async function finalizeSession() {
    setSubmitting(true);
    const rawScore = answers.reduce((sum, a) => sum + a.scoreDelta, 0);
    const maxScore = (allQuestions.length + 1) * 20;

    const score = calculateScore({
      rawScore,
      maxScore,
      wpm,
      currentStreak: streak.currentStreak,
      passageDifficulty,
    });

    await supabase.from('session_scores').insert({
      session_id: sessionId,
      user_id: user!.id,
      raw_score: score.rawScore,
      max_score: score.maxScore,
      pct_correct: score.pctCorrect,
      speed_bonus: score.speedBonus,
      streak_bonus: score.streakBonus,
      xp_earned: score.xpEarned,
      grade: score.grade,
    });

    await supabase.from('reading_sessions').update({
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId);

    const quality = pctToQuality(score.pctCorrect, wpm);
    const { data: existingCard } = await supabase
      .from('srs_cards')
      .select('*')
      .eq('user_id', user!.id)
      .eq('passage_id', passageId)
      .single();

    const baseCard = existingCard
      ? { repetition: existingCard.repetition, easiness: existingCard.easiness, intervalDays: existingCard.interval_days, dueDate: existingCard.due_date }
      : defaultCard();
    const updated = sm2Update(baseCard, quality);

    await supabase.from('srs_cards').upsert({
      user_id: user!.id,
      passage_id: passageId,
      repetition: updated.repetition,
      easiness: updated.easiness,
      interval_days: updated.intervalDays,
      due_date: updated.dueDate,
      last_reviewed: new Date().toISOString().split('T')[0],
    });

    await supabase.from('user_streaks').upsert({
      user_id: user!.id,
      total_xp: (streak.totalXp ?? 0) + score.xpEarned,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    await updateStreakAfterSession(user!.id);

    router.replace(`/results/${sessionId}`);
  }

  if (isFreeRecall) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <FreeRecallInput
          prompt={cache.free_recall_prompt}
          onSubmit={handleFreeRecallSubmit}
        />
      </SafeAreaView>
    );
  }

  if (!currentQuestion) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="h-1.5 bg-gray-100 mx-6 mt-3 mb-2 rounded-full">
        <View
          className="h-1.5 bg-brand-500 rounded-full"
          style={{ width: `${(currentIndex / (allQuestions.length + 1)) * 100}%` }}
        />
      </View>
      <QuestionCard
        question={currentQuestion}
        index={currentIndex - 1}
        total={allQuestions.length}
        onSubmit={handleQuestionSubmit}
      />
      {feedbackVisible && lastAnswer.question && (
        <FeedbackOverlay
          visible={feedbackVisible}
          isCorrect={lastAnswer.isCorrect}
          question={lastAnswer.question}
          userAnswer={lastAnswer.answer}
          onContinue={handleContinue}
        />
      )}
    </SafeAreaView>
  );
}
