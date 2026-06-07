import { Grade, SessionScoreResult } from '../types/app';

interface ScoreInput {
  rawScore: number;
  maxScore: number;
  wpm: number;
  currentStreak: number;
  passageDifficulty: number;
}

function gradeFromPct(pct: number): Grade {
  if (pct >= 0.95) return 'S';
  if (pct >= 0.80) return 'A';
  if (pct >= 0.65) return 'B';
  if (pct >= 0.50) return 'C';
  return 'D';
}

export function calculateScore(input: ScoreInput): SessionScoreResult {
  const { rawScore, maxScore, wpm, currentStreak, passageDifficulty } = input;
  const pctCorrect = maxScore > 0 ? rawScore / maxScore : 0;

  let speedBonus = 0;
  if (wpm >= 250 && pctCorrect >= 0.8) speedBonus = 20;
  else if (wpm >= 200 && pctCorrect >= 0.7) speedBonus = 10;

  const streakBonus = Math.min(currentStreak * 5, 30);

  const total = rawScore + speedBonus + streakBonus;
  const totalMax = maxScore + speedBonus + streakBonus;
  const totalPct = totalMax > 0 ? total / totalMax : 0;

  const difficultyMultiplier = 1 + (passageDifficulty - 5) * 0.1;
  const xpEarned = Math.max(0, Math.floor(total * difficultyMultiplier));

  return {
    rawScore,
    maxScore,
    pctCorrect,
    speedBonus,
    streakBonus,
    xpEarned,
    grade: gradeFromPct(totalPct),
  };
}

export function calibrateDifficulty(
  currentLevel: number,
  sessionsAtLevel: number,
  recentAccuracy: number,
  latestAccuracy: number
): number {
  if (sessionsAtLevel < 3) return currentLevel;
  if (latestAccuracy > 0.85 && recentAccuracy > 0.82) return Math.min(10, currentLevel + 1);
  if (latestAccuracy < 0.55 && recentAccuracy < 0.60) return Math.max(1, currentLevel - 1);
  return currentLevel;
}
