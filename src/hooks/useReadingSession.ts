import { useEffect, useRef, useCallback } from 'react';
import { useReadingStore } from '../stores/readingStore';
import { useSettingsStore } from '../stores/settingsStore';
import { scheduleMindWanderPings } from '../lib/attention';
import { MindWanderResponse } from '../types/app';

export function useReadingSession(onSessionLimit?: () => void) {
  const frequency = useSettingsStore((s) => s.mindWanderFrequency);
  const sessionLengthMinutes = useSettingsStore((s) => s.sessionLengthMinutes);
  const addMindWanderEvent = useReadingStore((s) => s.addMindWanderEvent);
  const startedAt = useReadingStore((s) => s.startedAt);

  const limitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingCleanupRef = useRef<(() => void) | null>(null);
  const showPingRef = useRef<(() => void) | null>(null);

  const registerPingCallback = useCallback((cb: () => void) => {
    showPingRef.current = cb;
  }, []);

  useEffect(() => {
    if (!startedAt) return;

    pingCleanupRef.current = scheduleMindWanderPings(frequency, () => {
      showPingRef.current?.();
    });

    if (sessionLengthMinutes > 0) {
      limitTimerRef.current = setTimeout(() => {
        onSessionLimit?.();
      }, sessionLengthMinutes * 60 * 1000);
    }

    return () => {
      pingCleanupRef.current?.();
      if (limitTimerRef.current) clearTimeout(limitTimerRef.current);
    };
  }, [startedAt, frequency, sessionLengthMinutes]);

  const recordMindWander = useCallback((response: MindWanderResponse) => {
    addMindWanderEvent({ timestamp: Date.now(), response });
  }, []);

  return { registerPingCallback, recordMindWander };
}
