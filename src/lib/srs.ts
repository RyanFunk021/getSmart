import { SM2Card } from '../types/app';

export function pctToQuality(pctCorrect: number, wpm: number, targetWpm = 200): number {
  if (pctCorrect >= 0.9 && wpm >= targetWpm) return 5;
  if (pctCorrect >= 0.8) return 4;
  if (pctCorrect >= 0.65) return 3;
  if (pctCorrect >= 0.5) return 2;
  if (pctCorrect >= 0.3) return 1;
  return 0;
}

export function sm2Update(card: SM2Card, quality: number): SM2Card {
  let { repetition, easiness, intervalDays } = card;

  if (quality >= 3) {
    if (repetition === 0) intervalDays = 1;
    else if (repetition === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easiness);
    repetition += 1;
  } else {
    repetition = 0;
    intervalDays = 1;
  }

  easiness = Math.max(1.3, easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  const due = new Date();
  due.setDate(due.getDate() + intervalDays);
  const dueDate = due.toISOString().split('T')[0];

  return { repetition, easiness, intervalDays, dueDate };
}

export function defaultCard(): SM2Card {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    repetition: 0,
    easiness: 2.5,
    intervalDays: 1,
    dueDate: tomorrow.toISOString().split('T')[0],
  };
}
