import { AttentionFrequency, MindWanderEvent, MindWanderResponse } from '../types/app';

const MIN_INTERVAL_MS: Record<string, number> = {
  low:    3 * 60 * 1000,
  medium: 90 * 1000,
  high:   45 * 1000,
};

const MAX_PINGS = 3;

export function scheduleMindWanderPings(
  frequency: AttentionFrequency,
  onPing: () => void
): () => void {
  if (frequency === 'off') return () => {};

  let timeoutId: ReturnType<typeof setTimeout>;
  let pingCount = 0;

  function scheduleNext() {
    if (pingCount >= MAX_PINGS) return;
    const min = MIN_INTERVAL_MS[frequency];
    const delay = min + Math.random() * min;
    timeoutId = setTimeout(() => {
      pingCount++;
      onPing();
      scheduleNext();
    }, delay);
  }

  scheduleNext();
  return () => clearTimeout(timeoutId);
}

export function mindWanderSummary(events: MindWanderEvent[]): {
  wanderCount: number;
  highWander: boolean;
} {
  const wanderCount = events.filter(e => e.response === 'wandered').length;
  return {
    wanderCount,
    highWander: events.length > 0 && wanderCount > events.length / 2,
  };
}

export function estimateWpm(wordsRead: number, elapsedMs: number): number {
  if (elapsedMs < 1000) return 0;
  return Math.round((wordsRead / elapsedMs) * 60000);
}
