import { create } from 'zustand';
import { AttentionFrequency, DifficultyMode, SessionLengthMinutes } from '../types/app';

interface SettingsState {
  sessionLengthMinutes: SessionLengthMinutes;
  mindWanderFrequency: AttentionFrequency;
  difficultyMode: DifficultyMode;
  fixedDifficulty: number;
  fontSize: 'small' | 'medium' | 'large';
  notificationsEnabled: boolean;
  reminderHour: number;
  setSessionLength: (v: SessionLengthMinutes) => void;
  setMindWanderFrequency: (v: AttentionFrequency) => void;
  setDifficultyMode: (v: DifficultyMode) => void;
  setFixedDifficulty: (v: number) => void;
  setFontSize: (v: 'small' | 'medium' | 'large') => void;
  setNotificationsEnabled: (v: boolean) => void;
  setReminderHour: (v: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  sessionLengthMinutes: 10,
  mindWanderFrequency: 'medium',
  difficultyMode: 'auto',
  fixedDifficulty: 5,
  fontSize: 'medium',
  notificationsEnabled: false,
  reminderHour: 8,
  setSessionLength: (v) => set({ sessionLengthMinutes: v }),
  setMindWanderFrequency: (v) => set({ mindWanderFrequency: v }),
  setDifficultyMode: (v) => set({ difficultyMode: v }),
  setFixedDifficulty: (v) => set({ fixedDifficulty: v }),
  setFontSize: (v) => set({ fontSize: v }),
  setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
  setReminderHour: (v) => set({ reminderHour: v }),
}));
