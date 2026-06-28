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
const SERVER_SYNC_INTERVAL = 60_000;

export function useWorkoutSession(workoutId: string) {
  const [_exerciseStates, _setExerciseStates] = useState<ExerciseState[]>([]);
  const [_notes, _setNotes] = useState('');
  const [_elapsedSeconds, _setElapsedSeconds] = useState(0);
  const [_restTimer, _setRestTimer] = useState<RestTimerState>({ exIndex: -1, active: false, seconds: 0, total: 0 });
  const [isSessionActive, setIsSessionActive] = useState(false);

  const isActiveRef = useRef(false);
  const hasRestoredRef = useRef(false);
  const logIdRef = useRef<string | null>(null);
  const serverSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    logId: logIdRef.current ?? undefined,
  }), [workoutId]);

  const persistence = useWorkoutPersistence(
    workoutId,
    getSessionData,
    isSessionActive,
    false,
    [_exerciseStates, _notes, _elapsedSeconds, _restTimer],
  );

  const syncToServer = useCallback(async () => {
    if (!logIdRef.current || !isActiveRef.current) return;
    try {
      const states = synced.ref.current.exerciseStates;
      const notes = synced.ref.current.notes;
      await fetch(`/api/aluno/workouts/${workoutId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logId: logIdRef.current,
          exerciseLogs: states.map((es: ExerciseState) => ({
            exerciseName: es.exerciseName,
            setsCompleted: es.setsLog.filter(s => s.completed).length,
            repsCompleted: es.setsLog.map(s => s.reps).join(','),
            weightUsed: es.setsLog.map(s => s.weight).join(','),
            warmupSetsCompleted: es.hasWarmup ? es.warmupLog.filter(w => w.completed).length : null,
            warmupRepsCompleted: es.hasWarmup ? es.warmupLog.map(w => w.reps).join(',') : null,
            warmupWeightUsed: es.hasWarmup ? es.warmupLog.map(w => w.weight).join(',') : null,
            setsLog: es.setsLog.map(s => ({ reps: s.reps, weight: s.weight, restTime: s.restTime, completed: s.completed })),
            warmupLog: es.hasWarmup ? es.warmupLog.map(w => ({
              reps: w.reps, weight: w.weight, weightUnit: w.weightUnit, restTime: w.restTime, completed: w.completed,
            })) : null,
          })),
          notes,
        }),
      });
    } catch {}
  }, [workoutId, synced]);

  const startServerSession = useCallback(async () => {
    if (logIdRef.current) return logIdRef.current;
    try {
      const res = await fetch(`/api/aluno/workouts/${workoutId}/start`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        logIdRef.current = data.logId;
        return data.logId;
      }
    } catch {}
    return null;
  }, [workoutId]);

  const stopServerSync = useCallback(() => {
    if (serverSyncTimerRef.current) {
      clearInterval(serverSyncTimerRef.current);
      serverSyncTimerRef.current = null;
    }
  }, []);

  const handleRestore = useCallback((session: WorkoutSession) => {
    setExerciseStates(session.exerciseStates);
    setNotes(session.notes);
    setElapsedSeconds(session.elapsedSeconds);
    if (session.restTimer) setRestTimer(session.restTimer);
    if (session.logId) logIdRef.current = session.logId;
    hasRestoredRef.current = true;
    setSessionActive(true);
    if (!logIdRef.current) startServerSession();
    serverSyncTimerRef.current = setInterval(syncToServer, SERVER_SYNC_INTERVAL);
  }, [startServerSession, syncToServer]);

  const handleFreshStart = useCallback(() => {
    setSessionActive(true);
    startServerSession();
    serverSyncTimerRef.current = setInterval(syncToServer, SERVER_SYNC_INTERVAL);
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
    stopServerSync();
    setSessionActive(false);
    await persistence.deleteSession();
    if (logIdRef.current) {
      try {
        await fetch(`/api/aluno/workouts/${workoutId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logId: logIdRef.current,
            exerciseLogs: [],
            notes: '[Treino cancelado]',
          }),
        });
      } catch {}
      logIdRef.current = null;
    }
  }, [persistence, workoutId, stopServerSync]);

  const clearSession = useCallback(async () => {
    stopServerSync();
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
    logIdRef.current = null;
  }, [persistence, stopServerSync]);

  useEffect(() => {
    return () => { stopServerSync(); };
  }, [stopServerSync]);

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
    syncToServer,
    startServerSession,
    logId: logIdRef.current,
  };
}
