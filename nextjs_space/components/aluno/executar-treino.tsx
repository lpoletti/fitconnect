'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { MediaGallery } from '@/components/shared/media-lightbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ClipboardList, History, ArrowLeft, Pencil,
  Dumbbell, Clock, Weight, CheckCircle, Trophy, Flame, CheckCheck,
  Calendar as CalendarIcon, XCircle, FileCheck, ChevronDown, ChevronUp,
  RotateCcw, Timer
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Avaliações', href: '/aluno/avaliacoes', icon: FileCheck },
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

function buildExerciseState(ex: any, lastExLog?: any): ExerciseState {
  // Try to use last log data to pre-fill
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

// Circular progress component
function CircularProgress({ percent, size = 44, stroke = 3, className = '' }: { percent: number; size?: number; stroke?: number; className?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent === 100 ? '#10b981' : percent > 0 ? '#f59e0b' : '#374151';
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color }}>{Math.round(percent)}%</span>
    </div>
  );
}

export function ExecutarTreino({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>([]);
  const [notes, setNotes] = useState('');
  const [startTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState('00:00:00');
  const [expandedEx, setExpandedEx] = useState<number>(0); // which exercise is expanded
  const [editingSet, setEditingSet] = useState<{ ex: number; set: number; type: 'work' | 'warmup' } | null>(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const hrs = Math.floor(diff / 3600).toString().padStart(2, '0');
      const mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const secs = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${hrs}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (!workoutId) return;
    fetch(`/api/aluno/workouts/${workoutId}`)
      .then((r: any) => r.ok ? r.json() : null)
      .then((d: any) => {
        setWorkout(d);
        if (d?.exercises) {
          const lastLogExercises = d?.lastLog?.exerciseLogs ?? [];
          setExerciseStates((d.exercises ?? []).map((ex: any) => {
            const matched = lastLogExercises.find((l: any) => l.exerciseName === ex.exerciseName);
            return buildExerciseState(ex, matched);
          }));
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

  const toggleSetCompleted = (exIdx: number, setIdx: number) => {
    const updated = [...exerciseStates];
    updated[exIdx].setsLog[setIdx].completed = !updated[exIdx].setsLog[setIdx].completed;
    setExerciseStates(updated);
    setEditingSet(null);
  };

  const toggleWarmupCompleted = (exIdx: number, setIdx: number) => {
    const updated = [...exerciseStates];
    updated[exIdx].warmupLog[setIdx].completed = !updated[exIdx].warmupLog[setIdx].completed;
    setExerciseStates(updated);
    setEditingSet(null);
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
    if (confirm('Tem certeza que deseja cancelar o treino? O progresso será perdido.')) {
      router.push('/aluno/treinos');
    }
  };

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
        toast.success('Treino concluído! Parabéns! 🏆');
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

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-4">
        {/* Header with timer */}
        <div className="flex items-center gap-3">
          <Link href="/aluno/treinos">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight truncate">{workout?.workoutName ?? 'Carregando...'}</h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              {workout?.professor?.user?.name ? `Prof. ${workout.professor.user.name}` : workout?.isPersonal ? 'Treino pessoal' : ''}
            </p>
          </div>
          {workout?.isPersonal && (
            <Link href={`/aluno/treinos/${workoutId}/editar`}>
              <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:hidden">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>

        {/* Timer bar - sticky on mobile */}
        {!loading && workout && (
          <div className="sticky top-0 z-10 bg-zinc-900 text-white rounded-xl p-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-400" />
              <span className="font-mono text-lg font-bold tracking-wider">{elapsed}</span>
            </div>
            <div className="flex items-center gap-3">
              <CircularProgress percent={globalPercent} size={36} stroke={3} />
              <span className="text-xs text-zinc-400">{completedCount}/{totalCount}</span>
            </div>
          </div>
        )}

        {/* Last log info */}
        {workout?.lastLog && (
          <div className="flex items-center gap-2 px-1">
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Dados do último treino pré-carregados
            </span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : !workout ? (
          <div className="text-center py-12 text-muted-foreground">Treino não encontrado.</div>
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
              const restTime = es.setsLog[0]?.restTime || '60s';

              return (
                <div key={ex?.id ?? i} className={cn(
                  'rounded-xl overflow-hidden transition-all',
                  'bg-zinc-900 text-white shadow-lg',
                  allExDone && 'ring-2 ring-emerald-500/40'
                )}>
                  {/* Exercise header - always visible, clickable */}
                  <button
                    type="button"
                    onClick={() => setExpandedEx(isExpanded ? -1 : i)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    {/* Thumbnail */}
                    {media.length > 0 ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                        {media[0].type === 'image' ? (
                          <img src={media[0].url} alt={es.exerciseName} className="w-full h-full object-cover" />
                        ) : (
                          <video src={media[0].url} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="h-6 w-6 text-zinc-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-zinc-400">{es.hasWarmup ? 'Com aquecimento' : 'Execução normal'}</p>
                      <p className={cn('font-bold text-sm truncate', allExDone && 'text-emerald-400')}>
                        {es.exerciseName}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {doneExSets} de {totalExSets} séries concluídas
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <CircularProgress percent={percent} size={40} stroke={3} />
                      {restTime && (
                        <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                          <Clock className="h-3 w-3" /> {restTime}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {/* Notes */}
                      {ex?.notes && (
                        <p className="text-xs text-amber-400/80 italic px-1 pb-1">{ex.notes}</p>
                      )}

                      {/* Media gallery */}
                      {media.length > 0 && (
                        <div className="pb-2">
                          <MediaGallery files={media} thumbnailClass="h-16 w-16" />
                        </div>
                      )}

                      {/* Warmup sets */}
                      {es.hasWarmup && es.warmupLog.length > 0 && (
                        <div className="bg-orange-950/30 border border-orange-800/30 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-medium text-orange-400 flex items-center gap-1">
                            <Flame className="h-3 w-3" /> Aquecimento ({warmupCompleted}/{es.warmupLog.length})
                          </p>
                          {es.warmupLog.map((ws, wi) => {
                            const isEditing = editingSet?.ex === i && editingSet?.set === wi && editingSet?.type === 'warmup';
                            return (
                              <div key={wi}>
                                <div className={cn(
                                  'flex items-center gap-2 p-2.5 rounded-lg transition-all',
                                  ws.completed ? 'bg-orange-900/30' : 'bg-zinc-800/50'
                                )}>
                                  <span className="w-6 h-6 rounded-md bg-orange-800/40 flex items-center justify-center text-[11px] font-bold text-orange-400 flex-shrink-0">{wi + 1}</span>
                                  <div className="flex items-center gap-3 flex-1 min-w-0 text-xs">
                                    <span className="flex items-center gap-1 text-zinc-300"><RotateCcw className="h-3 w-3 text-zinc-500" /> {ws.reps}</span>
                                    <span className="flex items-center gap-1 text-zinc-300"><Weight className="h-3 w-3 text-zinc-500" /> {ws.weight}{ws.weightUnit === 'percent' ? '%' : 'kg'}</span>
                                    <span className="flex items-center gap-1 text-zinc-300"><Clock className="h-3 w-3 text-zinc-500" /> {ws.restTime}</span>
                                  </div>
                                  <button type="button" onClick={() => toggleWarmupCompleted(i, wi)}
                                    className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                                      ws.completed ? 'bg-orange-500 border-orange-500' : 'border-zinc-600 hover:border-orange-400'
                                    )}>
                                    {ws.completed && <CheckCircle className="h-4 w-4 text-white" />}
                                  </button>
                                </div>
                                {/* Inline edit for warmup */}
                                {isEditing && (
                                  <div className="grid grid-cols-3 gap-2 mt-1.5 px-1">
                                    <div><Label className="text-[10px] text-orange-400">Reps</Label>
                                      <Input value={ws.reps} onChange={(e: any) => updateWarmupLog(i, wi, 'reps', e.target.value)}
                                        className="h-7 text-xs bg-zinc-800 border-zinc-700 text-white" /></div>
                                    <div><Label className="text-[10px] text-orange-400">Carga</Label>
                                      <Input value={ws.weight} onChange={(e: any) => updateWarmupLog(i, wi, 'weight', e.target.value)}
                                        className="h-7 text-xs bg-zinc-800 border-zinc-700 text-white" /></div>
                                    <div><Label className="text-[10px] text-orange-400">Descanso</Label>
                                      <Input value={ws.restTime} onChange={(e: any) => updateWarmupLog(i, wi, 'restTime', e.target.value)}
                                        className="h-7 text-xs bg-zinc-800 border-zinc-700 text-white" /></div>
                                  </div>
                                )}
                                <button type="button" onClick={() => setEditingSet(isEditing ? null : { ex: i, set: wi, type: 'warmup' })}
                                  className="text-[10px] text-orange-400/70 hover:text-orange-400 flex items-center gap-1 mt-0.5 ml-1">
                                  <Pencil className="h-2.5 w-2.5" /> {isEditing ? 'Fechar' : 'Editar série'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Work sets */}
                      {es.setsLog.map((set, si) => {
                        const isEditing = editingSet?.ex === i && editingSet?.set === si && editingSet?.type === 'work';
                        return (
                          <div key={si}>
                            <div className={cn(
                              'flex items-center gap-2 p-2.5 rounded-lg transition-all',
                              set.completed ? 'bg-emerald-950/30' : 'bg-zinc-800/50'
                            )}>
                              <span className="w-6 h-6 rounded-md bg-zinc-700 flex items-center justify-center text-[11px] font-bold text-zinc-300 flex-shrink-0">{si + 1}</span>
                              <div className="flex items-center gap-3 flex-1 min-w-0 text-xs">
                                <span className="flex items-center gap-1 text-zinc-300"><RotateCcw className="h-3 w-3 text-zinc-500" /> {set.reps}</span>
                                <span className="flex items-center gap-1 text-zinc-300"><Weight className="h-3 w-3 text-zinc-500" /> {set.weight || '0'}</span>
                                <span className="flex items-center gap-1 text-zinc-300"><Clock className="h-3 w-3 text-zinc-500" /> {set.restTime}</span>
                              </div>
                              <button type="button" onClick={() => toggleSetCompleted(i, si)}
                                className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                                  set.completed ? 'bg-amber-500 border-amber-500' : 'border-zinc-600 hover:border-amber-400'
                                )}>
                                {set.completed && <CheckCircle className="h-4 w-4 text-white" />}
                              </button>
                            </div>
                            {/* Inline edit */}
                            {isEditing && (
                              <div className="grid grid-cols-3 gap-2 mt-1.5 px-1">
                                <div><Label className="text-[10px] text-zinc-400">Reps</Label>
                                  <Input value={set.reps} onChange={(e: any) => updateSetLog(i, si, 'reps', e.target.value)}
                                    className="h-7 text-xs bg-zinc-800 border-zinc-700 text-white" /></div>
                                <div><Label className="text-[10px] text-zinc-400">Carga</Label>
                                  <Input value={set.weight} onChange={(e: any) => updateSetLog(i, si, 'weight', e.target.value)}
                                    placeholder="kg" className="h-7 text-xs bg-zinc-800 border-zinc-700 text-white" /></div>
                                <div><Label className="text-[10px] text-zinc-400">Descanso</Label>
                                  <Input value={set.restTime} onChange={(e: any) => updateSetLog(i, si, 'restTime', e.target.value)}
                                    className="h-7 text-xs bg-zinc-800 border-zinc-700 text-white" /></div>
                              </div>
                            )}
                            <button type="button" onClick={() => setEditingSet(isEditing ? null : { ex: i, set: si, type: 'work' })}
                              className="text-[10px] text-zinc-500 hover:text-amber-400 flex items-center gap-1 mt-0.5 ml-1">
                              <Pencil className="h-2.5 w-2.5" /> {isEditing ? 'Fechar' : 'Editar série'}
                            </button>
                          </div>
                        );
                      })}

                      {/* Complete all for this exercise */}
                      {!allExDone && (
                        <button type="button" onClick={() => markExerciseCompleted(i)}
                          className="w-full text-center text-xs text-amber-400/80 hover:text-amber-400 py-2 flex items-center justify-center gap-1.5 border-t border-zinc-800 mt-2">
                          <CheckCheck className="h-3.5 w-3.5" /> Concluir todos
                        </button>
                      )}
                    </div>
                  )}
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
                className="w-full gap-2 min-h-[48px]" size="lg">
                <Trophy className="h-5 w-5" />
                {saving ? 'Salvando...' : 'Concluir Treino'}
              </Button>
              <Button variant="outline" onClick={handleCancel}
                className="w-full gap-2 text-destructive min-h-[44px]">
                <XCircle className="h-4 w-4" /> Cancelar Treino
              </Button>
              {!allCompleted && (
                <p className="text-xs text-center text-muted-foreground">
                  Marque todas as séries como concluídas para finalizar.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
