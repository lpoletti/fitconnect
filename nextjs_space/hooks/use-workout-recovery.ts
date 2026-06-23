'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadWorkoutSession, deleteWorkoutSession, WorkoutSession } from '@/lib/workout-db';

export interface RecoveryInfo {
  workoutId: string;
  elapsedSeconds: number;
  lastUpdated: number;
}

const EMERGENCY_KEY = 'fitconnect-workout-bkp';

async function tryLoadSession(): Promise<WorkoutSession | undefined> {
  let session = await loadWorkoutSession();
  if (!session || session.status !== 'active') {
    try {
      const raw = localStorage.getItem(EMERGENCY_KEY);
      if (raw) {
        const parsed: WorkoutSession = JSON.parse(raw);
        if (parsed.status === 'active') session = parsed;
      }
    } catch {}
  }
  return session?.status === 'active' ? session : undefined;
}

export function useWorkoutRecovery(
  workoutId: string,
  onRestore: (session: WorkoutSession) => void,
  onFreshStart: () => void,
) {
  const [isRestoring, setIsRestoring] = useState(true);
  const [recovery, setRecovery] = useState<RecoveryInfo | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    tryLoadSession().then((session) => {
      if (session) {
        if (session.workoutId === workoutId) {
          onRestore(session);
        } else {
          setRecovery({
            workoutId: session.workoutId,
            elapsedSeconds: session.elapsedSeconds,
            lastUpdated: session.lastUpdated,
          });
          setIsRestoring(false);
          return;
        }
      } else {
        onFreshStart();
      }
      setIsRestoring(false);
    });
  }, [workoutId]);

  const discardRecovery = useCallback(async (removeLocalBackup: () => void) => {
    removeLocalBackup();
    await deleteWorkoutSession();
    setRecovery(null);
    onFreshStart();
  }, [onFreshStart]);

  const restoreRecovery = useCallback(async (onRestored: (session: WorkoutSession) => void) => {
    const session = await tryLoadSession();
    if (session) onRestored(session);
    setRecovery(null);
  }, []);

  return { isRestoring, recovery, discardRecovery, restoreRecovery };
}
