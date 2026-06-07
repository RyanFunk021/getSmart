import { create } from 'zustand';
import { MindWanderEvent } from '../types/app';

interface ReadingState {
  sessionId: string | null;
  passageId: string | null;
  passageTitle: string;
  passageBody: string;
  wordCount: number;
  passageDifficulty: number;
  startedAt: number | null;
  readingEndedAt: number | null;
  mindWanderEvents: MindWanderEvent[];
  scrollProgress: number;
  wpm: number;
  startSession: (params: {
    sessionId: string;
    passageId: string;
    title: string;
    body: string;
    wordCount: number;
    difficulty: number;
  }) => void;
  endReading: () => void;
  addMindWanderEvent: (event: MindWanderEvent) => void;
  setScrollProgress: (progress: number) => void;
  setWpm: (wpm: number) => void;
  reset: () => void;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  sessionId: null,
  passageId: null,
  passageTitle: '',
  passageBody: '',
  wordCount: 0,
  passageDifficulty: 5,
  startedAt: null,
  readingEndedAt: null,
  mindWanderEvents: [],
  scrollProgress: 0,
  wpm: 0,
  startSession: (params) =>
    set({
      sessionId: params.sessionId,
      passageId: params.passageId,
      passageTitle: params.title,
      passageBody: params.body,
      wordCount: params.wordCount,
      passageDifficulty: params.difficulty,
      startedAt: Date.now(),
      readingEndedAt: null,
      mindWanderEvents: [],
      scrollProgress: 0,
      wpm: 0,
    }),
  endReading: () => set({ readingEndedAt: Date.now() }),
  addMindWanderEvent: (event) =>
    set((s) => ({ mindWanderEvents: [...s.mindWanderEvents, event] })),
  setScrollProgress: (progress) => {
    const { wordCount, startedAt } = get();
    set({ scrollProgress: progress });
    if (startedAt && wordCount > 0) {
      const wordsRead = Math.floor(wordCount * progress);
      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs > 5000) {
        const wpm = Math.round((wordsRead / elapsedMs) * 60000);
        set({ wpm });
      }
    }
  },
  setWpm: (wpm) => set({ wpm }),
  reset: () =>
    set({
      sessionId: null,
      passageId: null,
      passageTitle: '',
      passageBody: '',
      wordCount: 0,
      passageDifficulty: 5,
      startedAt: null,
      readingEndedAt: null,
      mindWanderEvents: [],
      scrollProgress: 0,
      wpm: 0,
    }),
}));
