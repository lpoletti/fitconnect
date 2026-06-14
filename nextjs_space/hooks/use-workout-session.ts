'use client';

import { useEffect, useRef, useState, useCallback, SetStateAction } from 'react';
import {
  saveWorkoutSession,
  loadWorkoutSession,
  deleteWorkoutSession,
  ExerciseState,
  RestTimerState,
  WorkoutSession,
} from '@/lib/workout-db';

export interface RecoveryInfo {
  workoutId: string;
  elapsedSeconds: number;
  lastUpdated: number;
}

const EMERGENCY_KEY = 'fitconnect-workout-bkp';

export function useWorkoutSession(workoutId: string) {
  const [_exerciseStates, _setExerciseStates] = useState<ExerciseState[]>([]);
  const [_notes, _setNotes] = useState('');
  const [_elapsedSeconds, _setElapsedSeconds] = useState(0);
  const [_restTimer, _setRestTimer] = useState<RestTimerState>({ exIndex: -1, active: false, seconds: 0, total: 0 });
  const [isRestoring, setIsRestoring] = useState(true);
  const [recovery, setRecovery] = useState<RecoveryInfo | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRestoredRef = useRef(false);
  const isActiveRef = useRef(false);
  const loadedRef = useRef(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  function setSessionActive(val: boolean) {
    isActiveRef.current = val;
    setIsSessionActive(val);
  }

  // Refs atualizados INLINE nos setters wrappers - SEM race condition
  const latestRef = useRef({
    exerciseStates: [] as ExerciseState[],
    notes: '',
    elapsedSeconds: 0,
    restTimer: { exIndex: -1, active: false, seconds: 0, total: 0 } as RestTimerState,
  });

  // Wrappers que atualizam o ref junto com o state (sincrono)
  const setExerciseStates = useCallback((updater: SetStateAction<ExerciseState[]>) => {
    _setExerciseStates(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      latestRef.current.exerciseStates = next;
      return next;
    });
  }, []);

  const setNotes = useCallback((updater: SetStateAction<string>) => {
    _setNotes(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      latestRef.current.notes = next;
      return next;
    });
  }, []);

  const setElapsedSeconds = useCallback((updater: SetStateAction<number>) => {
    _setElapsedSeconds(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      latestRef.current.elapsedSeconds = next;
      return next;
    });
  }, []);

  const setRestTimer = useCallback((updater: SetStateAction<RestTimerState>) => {
    _setRestTimer(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      latestRef.current.restTimer = next;
      return next;
    });
  }, []);

  function persistToLocalStorage(data: WorkoutSession) {
    try { localStorage.setItem(EMERGENCY_KEY, JSON.stringify(data)); } catch {}
  }

  function removeLocalBackup() {
    try { localStorage.removeItem(EMERGENCY_KEY); } catch {}
  }

  const doSave = useCallback(() => {
    const data: WorkoutSession = {
      workoutId,
      ...latestRef.current,
      lastUpdated: Date.now(),
      status: 'active',
    };
    saveWorkoutSession(data);
    persistToLocalStorage(data);
  }, [workoutId, _exerciseStates, _notes, _elapsedSeconds, _restTimer]);

  const saveImmediately = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSave();
  }, [doSave]);

  const syncSaveForUnload = useCallback(() => {
    const data: WorkoutSession = {
      workoutId,
      ...latestRef.current,
      lastUpdated: Date.now(),
      status: 'active',
    };
    persistToLocalStorage(data);
  }, [workoutId, _exerciseStates, _notes, _elapsedSeconds, _restTimer]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    loadWorkoutSession().then((session) => {
      if (!session || session.status !== 'active') {
        try {
          const raw = localStorage.getItem(EMERGENCY_KEY);
          if (raw) {
            const parsed: WorkoutSession = JSON.parse(raw);
            if (parsed.status === 'active') session = parsed;
          }
        } catch {}
      }

      if (session && session.status === 'active') {
        if (session.workoutId === workoutId) {
          setExerciseStates(session.exerciseStates);
          setNotes(session.notes);
          setElapsedSeconds(session.elapsedSeconds);
          if (session.restTimer) setRestTimer(session.restTimer);
          hasRestoredRef.current = true;
          setSessionActive(true);
        } else {
          setRecovery({
            workoutId: session.workoutId,
            elapsedSeconds: session.elapsedSeconds,
            lastUpdated: session.lastUpdated,
          });
        }
      } else {
        setSessionActive(true);
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
    if (!isActiveRef.current || recovery) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSave, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [doSave, recovery]);

  const discardRecovery = useCallback(async () => {
    removeLocalBackup();
    await deleteWorkoutSession();
    setRecovery(null);
    setSessionActive(true);
    setElapsedSeconds(0);
    setRestTimer({ exIndex: -1, active: false, seconds: 0, total: 0 });
  }, []);

  const restoreRecovery = useCallback(async () => {
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
    if (session && session.status === 'active') {
      setExerciseStates(session.exerciseStates);
      setNotes(session.notes);
      setElapsedSeconds(session.elapsedSeconds);
      if (session.restTimer) setRestTimer(session.restTimer);
      hasRestoredRef.current = true;
      setSessionActive(true);
    }
    setRecovery(null);
  }, []);

  const cancelWorkout = useCallback(async () => {
    setSessionActive(false);
    removeLocalBackup();
    await deleteWorkoutSession();
  }, []);

  const clearSession = useCallback(async () => {
    setSessionActive(false);
    removeLocalBackup();
    await deleteWorkoutSession();
    latestRef.current = {
      exerciseStates: [], notes: '', elapsedSeconds: 0,
      restTimer: { exIndex: -1, active: false, seconds: 0, total: 0 },
    };
    _setExerciseStates([]);
    _setNotes('');
    _setElapsedSeconds(0);
    _setRestTimer({ exIndex: -1, active: false, seconds: 0, total: 0 });
  }, []);

  const hasRestored = hasRestoredRef.current;

  return {
    exerciseStates: _exerciseStates,
    setExerciseStates,
    notes: _notes,
    setNotes,
    elapsedSeconds: _elapsedSeconds,
    restTimer: _restTimer,
    setRestTimer,
    isRestoring,
    recovery,
    isSessionActive,
    hasRestored,
    saveImmediately,
    syncSaveForUnload,
    discardRecovery,
    restoreRecovery,
    cancelWorkout,
    clearSession,
  };
}
