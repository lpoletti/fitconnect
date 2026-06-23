'use client';

import { useEffect, useRef, useCallback } from 'react';
import { saveWorkoutSession, deleteWorkoutSession, WorkoutSession } from '@/lib/workout-db';

const EMERGENCY_KEY = 'fitconnect-workout-bkp';

export function useWorkoutPersistence(
  workoutId: string,
  getState: () => WorkoutSession,
  isActive: boolean,
  hasRecovery: boolean,
  deps: unknown[],
) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function persistToLocalStorage(data: WorkoutSession) {
    try { localStorage.setItem(EMERGENCY_KEY, JSON.stringify(data)); } catch {}
  }

  function removeLocalBackup() {
    try { localStorage.removeItem(EMERGENCY_KEY); } catch {}
  }

  const doSave = useCallback(() => {
    const data = getState();
    saveWorkoutSession(data);
    persistToLocalStorage(data);
  }, [workoutId, ...deps]);

  const saveImmediately = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSave();
  }, [doSave]);

  const syncSaveForUnload = useCallback(() => {
    const data = getState();
    persistToLocalStorage(data);
  }, [workoutId, ...deps]);

  useEffect(() => {
    if (!isActive || hasRecovery) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSave, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [doSave, isActive, hasRecovery, ...deps]);

  const deleteSession = useCallback(async () => {
    removeLocalBackup();
    await deleteWorkoutSession();
  }, []);

  return { saveImmediately, syncSaveForUnload, deleteSession, persistToLocalStorage, removeLocalBackup };
}
