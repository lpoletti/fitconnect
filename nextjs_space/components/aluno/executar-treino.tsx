'use client';

import { useEffect, useState, useCallback, memo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { MediaGallery } from '@/components/shared/media-lightbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { ProgressRing } from '@/components/fitness/progress-ring';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ClipboardList, History, ArrowLeft, Pencil,
  Dumbbell, Clock, Weight, CheckCircle, Trophy, Flame, CheckCheck,
  Calendar as CalendarIcon, XCircle, FileCheck, ChevronDown, ChevronUp,
  RotateCcw, Timer, Play, Zap, SkipForward, Square, RefreshCw, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkoutSession } from '@/hooks/use-workout-session';

function CircularRestMini({ seconds, total, onSkip }: { seconds: number; total: number; onSkip: () => void }) {
  const size = 38;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = (seconds / total) * 100;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onSkip(); }}
      className="relative inline-flex items-center justify-center cursor-pointer group"
      title="Pular descanso"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-linear" />
      </svg>
      <span className="absolute text-[10px] font-bold text-white font-mono">{seconds}</span>
      <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <SkipForward className="h-3 w-3 text-primary" />
      </div>
    </button>
  );
}

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Avaliacoes', href: '/aluno/avaliacoes', icon: FileCheck },
  { label: 'Calendario', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Historico', href: '/aluno/historico', icon: History },
];

import type { SetLog, WarmupSetLog, ExerciseState } from '@/lib/workout-db';

function buildExerciseState(ex: any, lastExLog?: any): ExerciseState {
  const lastSetsLog = lastExLog?.setsLog && Array.isArray(lastExLog.setsLog) ? lastExLog.setsLog : null;
  const lastWarmupLog = lastExLog?.warmupLog && Array.isArray(lastExLog.warmupLog) ? lastExLog.warmupLog : null;

  let setsLog: SetLog[] = [];
  if (ex?.setsConfig && Array.isArray(ex.setsConfig) && ex.setsConfig.length > 0) {
    setsLog = ex.setsConfig.map((s: any, idx: number) => ({
      reps: lastSetsLog?.[idx]?.reps ?? s?.reps ?? '12',
      weight: lastSetsLog?.[idx]?.weight ?? s?.weight ?? '',
      restTime: s?.restTime ?? '60s',
      completed: false,
    }));
  } else {
    const count = ex?.sets ?? 3;
    setsLog = Array.from({ length: count }, (_, idx) => ({
      reps: lastSetsLog?.[idx]?.reps ?? ex?.reps ?? '12',
      weight: lastSetsLog?.[idx]?.weight ?? ex?.suggestedWeight ?? '',
      restTime: ex?.restTime ?? '60s',
      completed: false,
    }));
  }

  let warmupLog: WarmupSetLog[] = [];
  if (ex?.hasWarmup && ex?.warmupConfig && Array.isArray(ex.warmupConfig)) {
    warmupLog = ex.warmupConfig.map((w: any, idx: number) => ({
      reps: lastWarmupLog?.[idx]?.reps ?? w?.reps ?? '15',
      weight: lastWarmupLog?.[idx]?.weight ?? w?.weight ?? '',
      weightUnit: w?.weightUnit ?? 'percent',
      restTime: w?.restTime ?? '30s',
      completed: false,
    }));
  }

  return {
    exerciseName: ex?.exerciseName ?? '',
    hasWarmup: ex?.hasWarmup ?? false,
    setsLog,
    warmupLog,
  };
}

function CircularProgress({ percent, size = 44, stroke = 3, className = '' }: { percent: number; size?: number; stroke?: number; className?: string }) {
  const color = percent === 100 ? 'hsl(var(--primary))' : percent > 0 ? 'hsl(var(--warning))' : 'hsl(var(--surface-elevated))';
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={(size - stroke) / 2} fill="none" stroke="hsl(var(--surface-elevated))" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={(size - stroke) / 2} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={2 * Math.PI * (size - stroke) / 2} strokeDashoffset={2 * Math.PI * (size - stroke) / 2 - (percent / 100) * 2 * Math.PI * (size - stroke) / 2}
          strokeLinecap="round" className="transition-all duration-700 ease-out" />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color }}>{Math.round(percent)}%</span>
    </div>
  );
}

const SetRow = memo(function SetRow({
  label, completed, reps, weight, restTime, isWarmup, isJustCompleted,
  onToggle,
  onUpdateReps, onUpdateWeight, onUpdateRest,
}: {
  label: string; completed: boolean; reps: string; weight: string; restTime: string;
  isWarmup: boolean; isJustCompleted: boolean;
  onToggle: () => void;
  onUpdateReps?: (val: string) => void; onUpdateWeight?: (val: string) => void; onUpdateRest?: (val: string) => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 p-3 min-h-[52px] rounded-xl border transition-all duration-200 cursor-pointer select-none',
        completed
          ? `${isWarmup ? 'bg-orange-500/8' : 'bg-primary/5'} border-transparent`
          : 'bg-secondary/30 border-border/30 hover:border-border/60 hover:bg-primary/5'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
          completed
            ? `${isWarmup ? 'bg-orange-500 border-orange-500' : 'bg-primary border-primary'} scale-100`
            : 'border-muted-foreground/30'
        )}
      >
        {completed && (
          <CheckCircle className={cn('h-4 w-4 text-white', isJustCompleted && 'animate-scale-check')} />
        )}
      </div>

      <span className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
        isWarmup ? 'bg-orange-500/15 text-orange-400' : 'bg-primary/10 text-primary'
      )}>
        {label}
      </span>

      <div className="flex items-center gap-4 flex-1 min-w-0 text-sm">
        <span className="flex items-center gap-1.5 text-foreground/80">
          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {completed ? (
            <span className="text-foreground/60">{reps}</span>
          ) : (
            <input
              type="text" value={reps}
              onChange={(e) => onUpdateReps?.(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-foreground/80 text-sm border-b border-transparent focus:border-primary/40 outline-none transition-colors px-1 py-0.5"
              style={{ width: `${Math.max(reps.length * 9, 24)}px` }}
            />
          )}
        </span>
        <span className="flex items-center gap-1.5 text-foreground/80">
          <Weight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {completed ? (
            <span className="text-foreground/60">{weight || '0'} {isWarmup ? '%' : 'kg'}</span>
          ) : (
            <>
              <input
                type="text" value={weight}
                onChange={(e) => onUpdateWeight?.(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-transparent text-foreground/80 text-sm border-b border-transparent focus:border-primary/40 outline-none transition-colors px-1 py-0.5"
                style={{ width: `${Math.max(weight.length * 9, 28)}px` }}
              />
              <span className="text-xs text-muted-foreground">{isWarmup ? '%' : 'kg'}</span>
            </>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-foreground/80">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {completed ? (
            <span className="text-foreground/60">{restTime}</span>
          ) : (
            <input
              type="text" value={restTime}
              onChange={(e) => onUpdateRest?.(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-foreground/80 text-sm border-b border-transparent focus:border-primary/40 outline-none transition-colors px-1 py-0.5"
              style={{ width: `${Math.max(restTime.length * 9, 28)}px` }}
            />
          )}
        </span>
      </div>
    </div>
  );
});

export function ExecutarTreino({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedEx, setExpandedEx] = useState<number>(0);
  const [justCompleted, setJustCompleted] = useState<{ ex: number; set: number } | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const {
    exerciseStates, setExerciseStates,
    notes, setNotes,
    elapsedSeconds, isRestoring, recovery, hasRestored, isSessionActive,
    restTimer, setRestTimer, saveImmediately, syncSaveForUnload,
    discardRecovery, restoreRecovery, cancelWorkout, clearSession,
  } = useWorkoutSession(workoutId);

  const isActive = isSessionActive && !isRestoring && !recovery && !loading;

  // Save when tab loses visibility (mobile browser switch, etc)
  useEffect(() => {
    if (!isActive) return;
    const handler = () => {
      if (document.visibilityState === 'hidden') saveImmediately();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isActive, saveImmediately]);

  // pagehide - mais confiavel que beforeunload em mobile Safari
  useEffect(() => {
    if (!isActive) return;
    const handler = () => syncSaveForUnload();
    window.addEventListener('pagehide', handler);
    return () => window.removeEventListener('pagehide', handler);
  }, [isActive, syncSaveForUnload]);

  // Rest countdown
  useEffect(() => {
    if (!restTimer.active || restTimer.seconds <= 0) return;
    const interval = setInterval(() => {
      setRestTimer((prev: { exIndex: number; active: boolean; seconds: number; total: number }) => {
        if (prev.seconds <= 1) return { ...prev, active: false, seconds: 0, exIndex: -1 };
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer.active, restTimer.seconds]);

  useEffect(() => {
    if (isRestoring || recovery || !workoutId) return;
    fetch(`/api/aluno/workouts/${workoutId}`)
      .then((r: any) => r.ok ? r.json() : null)
      .then((d: any) => {
        setWorkout(d);
        if (d?.exercises && !hasRestored) {
          const lastLogExercises = d?.lastLog?.exerciseLogs ?? [];
          setExerciseStates((d.exercises ?? []).map((ex: any) => {
            const matched = lastLogExercises.find((l: any) => l.exerciseName === ex.exerciseName);
            return buildExerciseState(ex, matched);
          }));
          setTimeout(() => saveImmediately(), 100);
        }
      })
      .catch(() => toast.error('Erro ao carregar treino.'))
      .finally(() => setLoading(false));
  }, [workoutId, isRestoring, recovery]);

  const toggleSetCompleted = (exIdx: number, setIdx: number) => {
    const es = exerciseStates[exIdx]?.setsLog[setIdx];
    if (!es) return;
    const wasCompleted = es.completed;
    const nowCompleted = !wasCompleted;
    setExerciseStates(prev => prev.map((ex, ei) =>
      ei !== exIdx ? ex : {
        ...ex,
        setsLog: ex.setsLog.map((s, si) =>
          si !== setIdx ? s : { ...s, completed: nowCompleted }
        ),
      }
    ));
    if (nowCompleted) {
      setJustCompleted({ ex: exIdx, set: setIdx });
      setTimeout(() => setJustCompleted(null), 800);
      const restStr = es.restTime ?? '60s';
      const restSec = parseInt(restStr) || 60;
      setRestTimer({ exIndex: exIdx, active: true, seconds: restSec, total: restSec });
      setTimeout(() => saveImmediately(), 50);
    }
  };

  const toggleWarmupCompleted = (exIdx: number, setIdx: number) => {
    const ws = exerciseStates[exIdx]?.warmupLog[setIdx];
    if (!ws) return;
    const wasCompleted = ws.completed;
    const nowCompleted = !wasCompleted;
    setExerciseStates(prev => prev.map((ex, ei) =>
      ei !== exIdx ? ex : {
        ...ex,
        warmupLog: ex.warmupLog.map((w, wi) =>
          wi !== setIdx ? w : { ...w, completed: nowCompleted }
        ),
      }
    ));
    if (nowCompleted) {
      const restStr = ws.restTime ?? '30s';
      const restSec = parseInt(restStr) || 30;
      setRestTimer({ exIndex: exIdx, active: true, seconds: restSec, total: restSec });
      setTimeout(() => saveImmediately(), 50);
    }
  };

  const markExerciseCompleted = (exIdx: number) => {
    setExerciseStates(prev => {
      const updated = [...prev];
      updated[exIdx] = {
        ...updated[exIdx],
        setsLog: updated[exIdx].setsLog.map((s) => ({ ...s, completed: true })),
        warmupLog: updated[exIdx].warmupLog.map((w) => ({ ...w, completed: true })),
      };
      return updated;
    });
    setTimeout(() => saveImmediately(), 50);
  };

  const getExPercent = (es: ExerciseState) => {
    const total = es.setsLog.length + es.warmupLog.length;
    if (total === 0) return 0;
    const done = es.setsLog.filter(s => s.completed).length + es.warmupLog.filter(w => w.completed).length;
    return Math.round((done / total) * 100);
  };

  const allCompleted = exerciseStates.length > 0 && exerciseStates.every((es) => {
    const setsOk = es.setsLog.every((s) => s.completed);
    const warmupOk = !es.hasWarmup || es.warmupLog.every((w) => w.completed);
    return setsOk && warmupOk;
  });

  const completedCount = exerciseStates.reduce((acc, es) => {
    return acc + es.setsLog.filter((s) => s.completed).length + es.warmupLog.filter((w) => w.completed).length;
  }, 0);
  const totalCount = exerciseStates.reduce((acc, es) => acc + es.setsLog.length + es.warmupLog.length, 0);
  const globalPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCancel = () => {
    cancelWorkout();
    router.push('/aluno/treinos');
  };

  const handleComplete = async () => {
    if (!allCompleted) {
      const ok = window.confirm('Nem todas as series foram concluidas. Deseja salvar o progresso atual e encerrar?');
      if (!ok) return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/aluno/workouts/${workoutId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseLogs: exerciseStates.map((es) => ({
            exerciseName: es.exerciseName,
            setsCompleted: es.setsLog.length,
            repsCompleted: es.setsLog.map((s) => s.reps).join(','),
            weightUsed: es.setsLog.map((s) => s.weight).join(','),
            setsLog: es.setsLog.map((s) => ({ reps: s.reps, weight: s.weight, restTime: s.restTime })),
            warmupLog: es.hasWarmup ? es.warmupLog.map((w) => ({
              reps: w.reps, weight: w.weight, weightUnit: w.weightUnit, restTime: w.restTime,
            })) : null,
          })),
          notes: notes || null,
        }),
      });
      if (res.ok) {
        await clearSession();
        toast.success('Treino concluido! Parabens!');
        router.push('/aluno/historico');
      } else {
        toast.error('Erro ao salvar treino.');
      }
    } catch {
      toast.error('Erro ao salvar treino.');
    } finally {
      setSaving(false);
    }
  };

  const getMediaForExercise = (ex: any) => {
    if (ex?.mediaFiles && Array.isArray(ex.mediaFiles) && ex.mediaFiles.length > 0) return ex.mediaFiles;
    if (ex?.mediaUrl) return [{ url: ex.mediaUrl, type: ex.mediaType }];
    return [];
  };

  const updateSetLog = (exIdx: number, setIdx: number, field: string, value: any) => {
    setExerciseStates(prev => prev.map((ex, ei) =>
      ei !== exIdx ? ex : {
        ...ex,
        setsLog: ex.setsLog.map((s, si) =>
          si !== setIdx ? s : { ...s, [field]: value }
        ),
      }
    ));
  };

  const updateWarmupLog = (exIdx: number, setIdx: number, field: string, value: any) => {
    setExerciseStates(prev => prev.map((ex, ei) =>
      ei !== exIdx ? ex : {
        ...ex,
        warmupLog: ex.warmupLog.map((w, wi) =>
          wi !== setIdx ? w : { ...w, [field]: value }
        ),
      }
    ));
  };

  return (
    <DashboardShell navItems={navItems}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { saveImmediately(); router.push('/aluno/treinos'); }}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {workout?.workoutName ?? (hasRestored ? 'Treino Restaurado' : 'Carregando...')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {workout?.professor?.user?.name ? `Prof. ${workout.professor.user.name}` : workout?.isPersonal ? 'Treino pessoal' : (!workout && exerciseStates.length > 0 ? 'Dados do treino anterior' : '')}
            </p>
          </div>
          {workout?.isPersonal && (
            <Link href={`/aluno/treinos/${workoutId}/editar`}>
              <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex border-border/50">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:hidden border-border/50">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>

        {/* Progress bar + Timer row */}
        {!loading && workout && (
          <div className="glass-strong rounded-2xl p-4 flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-mono text-lg font-bold tracking-wider text-white">{`${Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`}</span>
            </div>
            <div className="flex-1">
              <div className="progress-bar h-2.5">
                <motion.div
                  className="progress-bar-fill h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${globalPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <CircularProgress percent={globalPercent} size={36} stroke={3} />
              <span className="text-xs text-muted-foreground font-medium">{completedCount}/{totalCount}</span>
            </div>
          </div>
        )}

        {/* Session restored or last log info */}
        {recovery ? null : ((hasRestored || workout?.lastLog) && (
          <div className="flex items-center gap-2 px-1">
            <RotateCcw className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              {hasRestored ? 'Treino restaurado - continuando de onde parou' : 'Dados do ultimo treino pre-carregados'}
            </span>
          </div>
        ))}

        {/* Recovery screen */}
        {recovery && (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/15 flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Treino anterior encontrado</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Voce estava fazendo um treino que nao foi concluido. Deseja continuar de onde parou ou comecar um novo?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => { router.push(`/aluno/treinos/${recovery.workoutId}`); }} className="gap-2 min-h-[48px] rounded-xl text-base">
                <RotateCcw className="h-4 w-4" /> Continuar treino anterior
              </Button>
              <Button variant="outline" onClick={discardRecovery} className="gap-2 min-h-[48px] rounded-xl text-base border-border/50">
                <XCircle className="h-4 w-4" /> Descartar e comecar novo
              </Button>
            </div>
          </div>
        )}

        {!recovery && loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-muted/50 rounded w-48 mb-4" />
                <div className="h-3 bg-muted/30 rounded w-32 mb-3" />
                <div className="space-y-2">
                  <div className="h-12 bg-muted/20 rounded-xl" />
                  <div className="h-12 bg-muted/20 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : recovery ? null : !workout && exerciseStates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">Treino nao encontrado.</p>
          </div>
        ) : (
          <>
            {/* Exercise cards */}
            {exerciseStates.map((es, i) => {
              const ex = workout?.exercises?.[i];
              const percent = getExPercent(es);
              const isExpanded = expandedEx === i;
              const setsCompleted = es.setsLog.filter(s => s.completed).length;
              const warmupCompleted = es.warmupLog.filter(w => w.completed).length;
              const totalExSets = es.setsLog.length + es.warmupLog.length;
              const doneExSets = setsCompleted + warmupCompleted;
              const allExDone = percent === 100;
              const media = getMediaForExercise(ex);

              return (
                <motion.div
                  key={ex?.id ?? i}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'relative rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.20)]',
                    allExDone
                      ? 'bg-[rgba(34,197,94,0.10)] border-success'
                      : isExpanded
                        ? 'bg-card border-border/50'
                        : 'bg-surface border-border hover:border-border/80'
                  )}
                  style={isExpanded ? {
                    background: 'linear-gradient(90deg, rgba(16,185,129,0.15), transparent)',
                  } : undefined}
                >
                  {/* Left accent border when expanded */}
                  {isExpanded && (
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-r-full" />
                  )}

                  {/* Exercise header */}
                  <button
                    type="button"
                    onClick={() => setExpandedEx(isExpanded ? -1 : i)}
                    className="w-full p-4 flex items-center gap-4 text-left"
                  >
                    {/* Thumbnail */}
                    {media.length > 0 ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted/30 ring-1 ring-border/20">
                        {media[0].type === 'image' ? (
                          <img src={media[0].url} alt={es.exerciseName} className="w-full h-full object-cover" />
                        ) : (
                          <video src={media[0].url} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Dumbbell className="h-6 w-6 text-primary/60" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{es.hasWarmup ? 'Com aquecimento' : 'Serie normal'}</p>
                      <p className={cn('font-bold text-base truncate mt-0.5', allExDone && 'text-primary')}>
                        {es.exerciseName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {doneExSets} de {totalExSets} series concluidas
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <CircularProgress percent={percent} size={38} stroke={3} />
                      {restTimer.active && restTimer.exIndex === i && restTimer.seconds > 0 && (
                        <CircularRestMini
                          seconds={restTimer.seconds}
                          total={restTimer.total}
                          onSkip={() => setRestTimer({ exIndex: -1, active: false, seconds: 0, total: 0 })}
                        />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-5 space-y-3">
                          {/* Notes */}
                          {ex?.notes && (
                            <div className="text-xs text-amber-400/80 italic px-1 py-2 bg-amber-500/5 rounded-lg">
                              {ex.notes}
                            </div>
                          )}

                          {/* Media gallery */}
                          {media.length > 0 && (
                            <div className="py-1">
                              <MediaGallery files={media} thumbnailClass="h-20 w-20 rounded-xl" />
                            </div>
                          )}

                          {/* Warmup sets */}
                          {es.hasWarmup && es.warmupLog.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-orange-400 flex items-center gap-1.5">
                                <Flame className="h-3.5 w-3.5" /> Aquecimento ({warmupCompleted}/{es.warmupLog.length})
                              </p>
                              <div className="space-y-1.5 pl-2 border-l-2 border-orange-500/20">
                                {es.warmupLog.map((ws, wi) => (
                                  <SetRow
                                    key={wi}
                                    label={String(wi + 1)}
                                    completed={ws.completed}
                                    reps={ws.reps}
                                    weight={ws.weight}
                                    restTime={ws.restTime}
                                    isWarmup={true}
                                    isJustCompleted={false}
                                    onToggle={() => toggleWarmupCompleted(i, wi)}
                                    onUpdateReps={(val) => updateWarmupLog(i, wi, 'reps', val)}
                                    onUpdateWeight={(val) => updateWarmupLog(i, wi, 'weight', val)}
                                    onUpdateRest={(val) => updateWarmupLog(i, wi, 'restTime', val)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Work sets */}
                          <div className="space-y-1.5">
                            {es.setsLog.map((set, si) => (
                              <SetRow
                                key={si}
                                label={String(si + 1)}
                                completed={set.completed}
                                reps={set.reps}
                                weight={set.weight}
                                restTime={set.restTime}
                                isWarmup={false}
                                isJustCompleted={justCompleted?.ex === i && justCompleted?.set === si}
                                onToggle={() => toggleSetCompleted(i, si)}
                                onUpdateReps={(val) => updateSetLog(i, si, 'reps', val)}
                                onUpdateWeight={(val) => updateSetLog(i, si, 'weight', val)}
                                onUpdateRest={(val) => updateSetLog(i, si, 'restTime', val)}
                              />
                            ))}
                          </div>

                          {/* Complete all button */}
                          {!allExDone && (
                            <button
                              type="button"
                              onClick={() => markExerciseCompleted(i)}
                              className="w-full text-center text-xs text-primary/80 hover:text-primary py-2.5 flex items-center justify-center gap-1.5 border-t border-border/30 mt-3 transition-colors"
                            >
                              <CheckCheck className="h-3.5 w-3.5" /> Concluir todos os exercicios
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Complete workout section */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Observacoes do treino (opcional)</Label>
                <Input
                  value={notes}
                  onChange={(e: any) => setNotes(e.target.value)}
                  placeholder="Como foi o treino hoje?"
                  className="bg-secondary/30 border-border/30 focus:border-primary/40"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 gap-2 min-h-[52px] rounded-xl text-base font-semibold bg-primary hover:bg-primary-light text-white disabled:opacity-40"
                >
                  {saving ? (
                    <>Salvando...</>
                  ) : (
                    <><Trophy className="h-5 w-5" /> Concluir Treino</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="gap-2 min-h-[52px] rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="h-4 w-4" /> Cancelar
                </Button>
              </div>

              {!allCompleted && (
                <p className="text-xs text-center text-muted-foreground">
                  Voce pode encerrar mesmo sem concluir todas as series. O progresso sera salvo.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
