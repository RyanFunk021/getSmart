import { create } from 'zustand';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
  totalSessions: number;
  totalXp: number;
  freezeTokens: number;
}

interface ProgressState {
  streak: StreakData;
  userLevel: number;
  recentAccuracy: number;
  setStreak: (data: StreakData) => void;
  addXp: (amount: number) => void;
  setUserLevel: (level: number) => void;
  setRecentAccuracy: (accuracy: number) => void;
}

const defaultStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastSessionDate: null,
  totalSessions: 0,
  totalXp: 0,
  freezeTokens: 1,
};

export const useProgressStore = create<ProgressState>((set) => ({
  streak: defaultStreak,
  userLevel: 3,
  recentAccuracy: 0.7,
  setStreak: (data) => set({ streak: data }),
  addXp: (amount) =>
    set((s) => ({ streak: { ...s.streak, totalXp: s.streak.totalXp + amount } })),
  setUserLevel: (level) => set({ userLevel: level }),
  setRecentAccuracy: (accuracy) => set({ recentAccuracy: accuracy }),
}));
