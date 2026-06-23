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
import { useRefSyncedState, SyncedState } from './use-ref-synced-state';
import { useWorkoutPersistence } from './use-workout-persistence';
import { useWorkoutRecovery, RecoveryInfo } from './use-workout-recovery';

export type { RecoveryInfo };

const EMERGENCY_KEY = 'fitconnect-workout-bkp';

export function useWorkoutSession(workoutId: string) {
  const [_exerciseStates, _setExerciseStates] = useState<ExerciseState[]>([]);
  const [_notes, _setNotes] = useState('');
  const [_elapsedSeconds, _setElapsedSeconds] = useState(0);
  const [_restTimer, _setRestTimer] = useState<RestTimerState>({ exIndex: -1, active: false, seconds: 0, total: 0 });
  const [isSessionActive, setIsSessionActive] = useState(false);

  const isActiveRef = useRef(false);
  const hasRestoredRef = useRef(false);

  const synced = useRefSyncedState({
    exerciseStates: [],
    notes: '',
    elapsedSeconds: 0,
    restTimer: { exIndex: -1, active: false, seconds: 0, total: 0 },
  });

  const setExerciseStates = useCallback((updater: SetStateAction<ExerciseState[]>) => {
    _setExerciseStates(synced.update('exerciseStates', updater));
  }, [synced]);

  const setNotes = useCallback((updater: SetStateAction<string>) => {
    _setNotes(synced.update('notes', updater));
  }, [synced]);

  const setElapsedSeconds = useCallback((updater: SetStateAction<number>) => {
    _setElapsedSeconds(synced.update('elapsedSeconds', updater));
  }, [synced]);

  const setRestTimer = useCallback((updater: SetStateAction<RestTimerState>) => {
    _setRestTimer(synced.update('restTimer', updater));
  }, [synced]);

  function setSessionActive(val: boolean) {
    isActiveRef.current = val;
    setIsSessionActive(val);
  }

  const getSessionData = useCallback((): WorkoutSession => ({
    workoutId,
    ...synced.ref.current,
    lastUpdated: Date.now(),
    status: 'active',
  }), [workoutId]);

  const persistence = useWorkoutPersistence(
    workoutId,
    getSessionData,
    isSessionActive,
    false,
    [_exerciseStates, _notes, _elapsedSeconds, _restTimer],
  );

  const handleRestore = useCallback((session: WorkoutSession) => {
    setExerciseStates(session.exerciseStates);
    setNotes(session.notes);
    setElapsedSeconds(session.elapsedSeconds);
    if (session.restTimer) setRestTimer(session.restTimer);
    hasRestoredRef.current = true;
    setSessionActive(true);
  }, []);

  const handleFreshStart = useCallback(() => {
    setSessionActive(true);
  }, []);

  const { isRestoring, recovery, discardRecovery: _discardRecovery, restoreRecovery: _restoreRecovery } = useWorkoutRecovery(
    workoutId,
    handleRestore,
    handleFreshStart,
  );

  useEffect(() => {
    if (isRestoring || recovery) return;
    if (!isActiveRef.current) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRestoring, recovery]);

  const discardRecovery = useCallback(async () => {
    await _discardRecovery(persistence.removeLocalBackup);
    setElapsedSeconds(0);
    setRestTimer({ exIndex: -1, active: false, seconds: 0, total: 0 });
  }, [_discardRecovery, persistence.removeLocalBackup]);

  const restoreRecovery = useCallback(async () => {
    await _restoreRecovery(handleRestore);
  }, [_restoreRecovery, handleRestore]);

  const cancelWorkout = useCallback(async () => {
    setSessionActive(false);
    await persistence.deleteSession();
  }, [persistence]);

  const clearSession = useCallback(async () => {
    setSessionActive(false);
    await persistence.deleteSession();
    synced.ref.current = {
      exerciseStates: [], notes: '', elapsedSeconds: 0,
      restTimer: { exIndex: -1, active: false, seconds: 0, total: 0 },
    };
    _setExerciseStates([]);
    _setNotes('');
    _setElapsedSeconds(0);
    _setRestTimer({ exIndex: -1, active: false, seconds: 0, total: 0 });
  }, [persistence]);

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
    hasRestored: hasRestoredRef.current,
    saveImmediately: persistence.saveImmediately,
    syncSaveForUnload: persistence.syncSaveForUnload,
    discardRecovery,
    restoreRecovery,
    cancelWorkout,
    clearSession,
  };
}
