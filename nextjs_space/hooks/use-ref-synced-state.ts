'use client';

import { useRef, useCallback, SetStateAction } from 'react';
import { ExerciseState, RestTimerState } from '@/lib/workout-db';

export interface SyncedState {
  exerciseStates: ExerciseState[];
  notes: string;
  elapsedSeconds: number;
  restTimer: RestTimerState;
}

export function useRefSyncedState(initial: SyncedState) {
  const ref = useRef<SyncedState>({ ...initial });

  const update = useCallback(
    <K extends keyof SyncedState>(key: K, updater: SetStateAction<SyncedState[K]>) => {
      return (prev: SyncedState[K]): SyncedState[K] => {
        const next = typeof updater === 'function' ? (updater as (p: SyncedState[K]) => SyncedState[K])(prev) : updater;
        ref.current[key] = next;
        return next;
      };
    },
    [],
  );

  return { ref, update };
}
