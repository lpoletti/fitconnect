import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface SetLog {
  reps: string;
  weight: string;
  restTime: string;
  completed: boolean;
}

export interface WarmupSetLog {
  reps: string;
  weight: string;
  weightUnit: string;
  restTime: string;
  completed: boolean;
}

export interface ExerciseState {
  exerciseName: string;
  setsLog: SetLog[];
  warmupLog: WarmupSetLog[];
  hasWarmup: boolean;
}

export interface RestTimerState {
  exIndex: number;
  active: boolean;
  seconds: number;
  total: number;
}

export interface WorkoutSession {
  workoutId: string;
  exerciseStates: ExerciseState[];
  notes: string;
  elapsedSeconds: number;
  restTimer: RestTimerState;
  lastUpdated: number;
  status: 'active' | 'completed';
  startedAt?: number;
  logId?: string;
}

interface FitConnectDB extends DBSchema {
  workoutSessions: {
    key: string;
    value: WorkoutSession;
  };
}

const DB_NAME = 'fitconnect-store';
const DB_VERSION = 1;
const STORE_NAME = 'workoutSessions';

let dbPromise: Promise<IDBPDatabase<FitConnectDB>> | null = null;

function getDB(): Promise<IDBPDatabase<FitConnectDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FitConnectDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveWorkoutSession(session: WorkoutSession): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, session, 'current');
}

export async function loadWorkoutSession(): Promise<WorkoutSession | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, 'current');
}

export async function deleteWorkoutSession(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, 'current');
}
