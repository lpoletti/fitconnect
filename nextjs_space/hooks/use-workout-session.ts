'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  saveWorkoutSession,
  loadWorkoutSession,
  deleteWorkoutSession,
  ExerciseState,
} from '@/lib/workout-db';

export interface RecoveryInfo {
  workoutId: string;
  elapsedSeconds: number;
  lastUpdated: number;
}

export function useWorkoutSession(workoutId: string) {
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>([]);
  const [notes, setNotes] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRestoring, setIsRestoring] = useState(true);
  const [recovery, setRecovery] = useState<RecoveryInfo | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRestoredRef = useRef(false);
  const isActiveRef = useRef(false);

  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    loadWorkoutSession().then((session) => {
      if (session && session.status === 'active') {
        if (session.workoutId === workoutId) {
          setExerciseStates(session.exerciseStates);
          setNotes(session.notes);
          setElapsedSeconds(session.elapsedSeconds);
          hasRestoredRef.current = true;
          isActiveRef.current = true;
        } else {
          setRecovery({
            workoutId: session.workoutId,
            elapsedSeconds: session.elapsedSeconds,
            lastUpdated: session.lastUpdated,
          });
        }
      } else {
        isActiveRef.current = true;
      }
      setIsRestoring(false);
    });
  }, [workoutId]);

  useEffect(() => {
    if (isRestoring || recovery) return;
    if (!isActiveRef.current) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRestoring, recovery]);

  useEffect(() => {
    if (!isActiveRef.current && !recovery) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveWorkoutSession({
        workoutId,
        exerciseStates,
        notes,
        elapsedSeconds,
        lastUpdated: Date.now(),
        status: 'active',
      });
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [workoutId, exerciseStates, notes, elapsedSeconds, recovery]);

  const discardRecovery = useCallback(async () => {
    await deleteWorkoutSession();
    setRecovery(null);
    isActiveRef.current = true;
    setElapsedSeconds(0);
  }, []);

  const restoreRecovery = useCallback(async () => {
    const session = await loadWorkoutSession();
    if (session && session.status === 'active') {
      setExerciseStates(session.exerciseStates);
      setNotes(session.notes);
      setElapsedSeconds(session.elapsedSeconds);
      hasRestoredRef.current = true;
      isActiveRef.current = true;
    }
    setRecovery(null);
  }, []);

  const cancelWorkout = useCallback(async () => {
    await deleteWorkoutSession();
    isActiveRef.current = false;
  }, []);

  const clearSession = useCallback(async () => {
    await deleteWorkoutSession();
    setExerciseStates([]);
    setNotes('');
    setElapsedSeconds(0);
    isActiveRef.current = false;
  }, []);

  const hasRestored = hasRestoredRef.current;

  return {
    exerciseStates,
    setExerciseStates,
    notes,
    setNotes,
    elapsedSeconds,
    isRestoring,
    recovery,
    hasRestored,
    discardRecovery,
    restoreRecovery,
    cancelWorkout,
    clearSession,
  };
}
