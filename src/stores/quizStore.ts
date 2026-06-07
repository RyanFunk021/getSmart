import { create } from 'zustand';
import { Question, PassageAICache } from '../types/app';

interface QuizAnswer {
  questionIndex: number;
  userAnswer: string;
  isCorrect: boolean;
  scoreDelta: number;
  timeToAnswerMs: number;
}

interface QuizState {
  cache: PassageAICache | null;
  currentIndex: number;
  answers: QuizAnswer[];
  startedAt: number | null;
  questionStartedAt: number | null;
  loading: boolean;
  setCache: (cache: PassageAICache) => void;
  setLoading: (v: boolean) => void;
  nextQuestion: () => void;
  submitAnswer: (answer: Omit<QuizAnswer, 'timeToAnswerMs'>) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  cache: null,
  currentIndex: 0,
  answers: [],
  startedAt: null,
  questionStartedAt: null,
  loading: false,
  setCache: (cache) => set({ cache, startedAt: Date.now(), questionStartedAt: Date.now() }),
  setLoading: (v) => set({ loading: v }),
  nextQuestion: () =>
    set((s) => ({ currentIndex: s.currentIndex + 1, questionStartedAt: Date.now() })),
  submitAnswer: (answer) => {
    const { questionStartedAt } = get();
    const timeToAnswerMs = questionStartedAt ? Date.now() - questionStartedAt : 0;
    set((s) => ({ answers: [...s.answers, { ...answer, timeToAnswerMs }] }));
  },
  reset: () =>
    set({
      cache: null,
      currentIndex: 0,
      answers: [],
      startedAt: null,
      questionStartedAt: null,
      loading: false,
    }),
}));
