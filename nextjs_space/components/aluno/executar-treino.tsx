'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LayoutDashboard, ClipboardList, History, ArrowLeft,
  Dumbbell, Clock, Weight, CheckCircle, Trophy, Flame, CheckCheck, Calendar as CalendarIcon
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Calendário', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Histórico', href: '/aluno/historico', icon: History },
];

interface SetLog {
  reps: string;
  weight: string;
  restTime: string;
  completed: boolean;
}

interface WarmupSetLog {
  reps: string;
  weight: string;
  weightUnit: string;
  restTime: string;
  completed: boolean;
}

interface ExerciseState {
  exerciseName: string;
  setsLog: SetLog[];
  warmupLog: WarmupSetLog[];
  hasWarmup: boolean;
}

function buildExerciseState(ex: any): ExerciseState {
  let setsLog: SetLog[] = [];
  if (ex?.setsConfig && Array.isArray(ex.setsConfig) && ex.setsConfig.length > 0) {
    setsLog = ex.setsConfig.map((s: any) => ({
      reps: s?.reps ?? '12',
      weight: s?.weight ?? '',
      restTime: s?.restTime ?? '60s',
      completed: false,
    }));
  } else {
    const count = ex?.sets ?? 3;
    setsLog = Array.from({ length: count }, () => ({
      reps: ex?.reps ?? '12',
      weight: ex?.suggestedWeight ?? '',
      restTime: ex?.restTime ?? '60s',
      completed: false,
    }));
  }

  let warmupLog: WarmupSetLog[] = [];
  if (ex?.hasWarmup && ex?.warmupConfig && Array.isArray(ex.warmupConfig)) {
    warmupLog = ex.warmupConfig.map((w: any) => ({
      reps: w?.reps ?? '15',
      weight: w?.weight ?? '',
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

export function ExecutarTreino({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!workoutId) return;
    fetch(`/api/aluno/workouts/${workoutId}`)
      .then((r: any) => r.ok ? r.json() : null)
      .then((d: any) => {
        setWorkout(d);
        if (d?.exercises) {
          setExerciseStates((d.exercises ?? []).map(buildExerciseState));
        }
      })
      .catch(() => toast.error('Erro ao carregar treino.'))
      .finally(() => setLoading(false));
  }, [workoutId]);

  const updateSetLog = (exIdx: number, setIdx: number, field: string, value: any) => {
    const updated = [...exerciseStates];
    (updated[exIdx].setsLog[setIdx] as any)[field] = value;
    setExerciseStates(updated);
  };

  const updateWarmupLog = (exIdx: number, setIdx: number, field: string, value: any) => {
    const updated = [...exerciseStates];
    (updated[exIdx].warmupLog[setIdx] as any)[field] = value;
    setExerciseStates(updated);
  };

  const markAllCompleted = () => {
    setExerciseStates(prev => prev.map((es) => ({
      ...es,
      setsLog: es.setsLog.map((s) => ({ ...s, completed: true })),
      warmupLog: es.warmupLog.map((w) => ({ ...w, completed: true })),
    })));
    toast.success('Todas as séries marcadas como concluídas!');
  };

  const markExerciseCompleted = (exIdx: number) => {
    const updated = [...exerciseStates];
    updated[exIdx] = {
      ...updated[exIdx],
      setsLog: updated[exIdx].setsLog.map((s) => ({ ...s, completed: true })),
      warmupLog: updated[exIdx].warmupLog.map((w) => ({ ...w, completed: true })),
    };
    setExerciseStates(updated);
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

  const handleComplete = async () => {
    if (!allCompleted) {
      toast.error('Marque todas as séries como concluídas.');
      return;
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
        toast.success('Treino concluído! Parabéns! \uD83C\uDFC6');
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

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/aluno/treinos">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold tracking-tight">{workout?.workoutName ?? 'Carregando...'}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {workout?.professor?.user?.name ? `Prof. ${workout.professor.user.name}` : ''}
            </p>
          </div>
          {totalCount > 0 && (
            <div className="flex items-center gap-3">
              {!allCompleted && (
                <Button variant="outline" size="sm" onClick={markAllCompleted} className="gap-1.5 text-xs">
                  <CheckCheck className="h-3.5 w-3.5" /> Marcar Todas
                </Button>
              )}
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Progresso</p>
                <p className="text-sm font-bold text-primary">{completedCount}/{totalCount}</p>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : !workout ? (
          <div className="text-center py-12 text-muted-foreground">Treino não encontrado.</div>
        ) : (
          <>
            {exerciseStates.map((es, i) => {
              const ex = workout?.exercises?.[i];
              const allExSetsCompleted = es.setsLog.every((s) => s.completed) &&
                (!es.hasWarmup || es.warmupLog.every((w) => w.completed));
              return (
                <div key={ex?.id ?? i} className={`bg-card rounded-xl p-5 shadow-[var(--shadow-md)] transition-all space-y-4 ${
                  allExSetsCompleted ? 'ring-2 ring-emerald-500/30 bg-emerald-50/5' : ''
                }`}>
                  {/* Exercise header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${allExSetsCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {es.exerciseName}
                        </p>
                        {ex?.notes && <p className="text-xs text-muted-foreground italic">{ex.notes}</p>}
                        {ex?.mediaUrl && (
                          <div className="mt-2">
                            {ex.mediaType === 'image' ? (
                              <img src={ex.mediaUrl} alt={es.exerciseName} className="h-28 rounded-lg object-cover" />
                            ) : (
                              <video src={ex.mediaUrl} className="h-28 rounded-lg" controls />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!allExSetsCompleted && (
                        <Button variant="ghost" size="sm" onClick={() => markExerciseCompleted(i)}
                          className="h-7 px-2 text-[10px] gap-1 text-muted-foreground hover:text-primary">
                          <CheckCheck className="h-3 w-3" /> Todas
                        </Button>
                      )}
                      {allExSetsCompleted && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                    </div>
                  </div>

                  {/* Warmup sets */}
                  {es.hasWarmup && es.warmupLog.length > 0 && (
                    <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-orange-700 dark:text-orange-400 flex items-center gap-1">
                        <Flame className="h-3 w-3" /> Aquecimento ({es.warmupLog.filter((w) => w.completed).length}/{es.warmupLog.length})
                      </p>
                      {es.warmupLog.map((ws, wi) => (
                        <div key={wi} className={`rounded-md p-2.5 space-y-1.5 transition-all ${
                          ws.completed ? 'bg-orange-100/50 dark:bg-orange-900/20' : 'bg-white/50 dark:bg-background/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-orange-200/50 dark:bg-orange-800/30 flex items-center justify-center text-[10px] font-bold text-orange-700 dark:text-orange-400">{wi + 1}</span>
                              <span className="text-xs text-orange-600 dark:text-orange-400">
                                {ws.reps} reps • {ws.weight}{ws.weightUnit === 'percent' ? '% da carga' : 'kg'}
                                {ws.restTime && <span> • <Clock className="h-3 w-3 inline" /> {ws.restTime}</span>}
                              </span>
                            </div>
                            <Checkbox
                              checked={ws.completed}
                              onCheckedChange={(checked: any) => updateWarmupLog(i, wi, 'completed', !!checked)}
                            />
                          </div>
                          {ws.completed && (
                            <div className="grid grid-cols-3 gap-2 pl-7">
                              <div className="space-y-0.5">
                                <Label className="text-[10px] text-orange-600 dark:text-orange-400">Reps feitas</Label>
                                <Input value={ws.reps}
                                  onChange={(e: any) => updateWarmupLog(i, wi, 'reps', e.target.value)}
                                  className="h-7 text-xs" />
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-[10px] text-orange-600 dark:text-orange-400">Carga ({ws.weightUnit === 'percent' ? '%' : 'kg'})</Label>
                                <Input value={ws.weight}
                                  onChange={(e: any) => updateWarmupLog(i, wi, 'weight', e.target.value)}
                                  className="h-7 text-xs" />
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-[10px] text-orange-600 dark:text-orange-400">Descanso</Label>
                                <Input value={ws.restTime}
                                  onChange={(e: any) => updateWarmupLog(i, wi, 'restTime', e.target.value)}
                                  className="h-7 text-xs" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Work sets */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" /> Séries de trabalho ({es.setsLog.filter((s) => s.completed).length}/{es.setsLog.length})
                    </p>
                    {es.setsLog.map((set, si) => (
                      <div key={si} className={`rounded-md p-2.5 space-y-1.5 transition-all ${
                        set.completed ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'bg-muted/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{si + 1}</span>
                            <span className="text-xs text-muted-foreground">
                              {set.reps} reps
                              {set.weight && <span> • <Weight className="h-3 w-3 inline" /> {set.weight}</span>}
                              {set.restTime && <span> • <Clock className="h-3 w-3 inline" /> {set.restTime}</span>}
                            </span>
                          </div>
                          <Checkbox
                            checked={set.completed}
                            onCheckedChange={(checked: any) => updateSetLog(i, si, 'completed', !!checked)}
                          />
                        </div>
                        {set.completed && (
                          <div className="grid grid-cols-3 gap-2 pl-7">
                            <div className="space-y-0.5">
                              <Label className="text-[10px]">Reps feitas</Label>
                              <Input value={set.reps}
                                onChange={(e: any) => updateSetLog(i, si, 'reps', e.target.value)}
                                className="h-7 text-xs" />
                            </div>
                            <div className="space-y-0.5">
                              <Label className="text-[10px]">Carga usada</Label>
                              <Input value={set.weight}
                                onChange={(e: any) => updateSetLog(i, si, 'weight', e.target.value)}
                                placeholder="kg" className="h-7 text-xs" />
                            </div>
                            <div className="space-y-0.5">
                              <Label className="text-[10px]">Descanso</Label>
                              <Input value={set.restTime}
                                onChange={(e: any) => updateSetLog(i, si, 'restTime', e.target.value)}
                                className="h-7 text-xs" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Notes & Complete */}
            <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] space-y-4">
              <div className="space-y-2">
                <Label>Observações do treino (opcional)</Label>
                <Input value={notes} onChange={(e: any) => setNotes(e.target.value)}
                  placeholder="Como foi o treino hoje?" />
              </div>
              <Button onClick={handleComplete} disabled={!allCompleted || saving}
                className="w-full gap-2" size="lg">
                <Trophy className="h-5 w-5" />
                {saving ? 'Salvando...' : 'Concluir Treino'}
              </Button>
              {!allCompleted && (
                <p className="text-xs text-center text-muted-foreground">
                  Marque todas as séries (aquecimento + trabalho) como concluídas para finalizar.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}