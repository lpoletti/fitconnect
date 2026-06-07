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
  Dumbbell, Clock, Weight, CheckCircle, Trophy, Flame
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Histórico', href: '/aluno/historico', icon: History },
];

interface ExerciseLog {
  exerciseName: string;
  setsCompleted: number;
  repsCompleted: string;
  weightUsed: string;
  completed: boolean;
  warmupCompleted: boolean;
  warmupSetsCompleted: number;
  warmupRepsCompleted: string;
  warmupWeightUsed: string;
}

export function ExecutarTreino({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!workoutId) return;
    fetch(`/api/aluno/workouts/${workoutId}`)
      .then((r: any) => r.ok ? r.json() : null)
      .then((d: any) => {
        setWorkout(d);
        if (d?.exercises) {
          setExerciseLogs(
            (d.exercises ?? []).map((ex: any) => ({
              exerciseName: ex?.exerciseName ?? '',
              setsCompleted: ex?.sets ?? 0,
              repsCompleted: ex?.reps ?? '0',
              weightUsed: ex?.suggestedWeight ?? '',
              completed: false,
              warmupCompleted: false,
              warmupSetsCompleted: ex?.warmupSets ?? 0,
              warmupRepsCompleted: ex?.warmupReps ?? '0',
              warmupWeightUsed: ex?.warmupWeight ?? '',
            }))
          );
        }
      })
      .catch(() => toast.error('Erro ao carregar treino.'))
      .finally(() => setLoading(false));
  }, [workoutId]);

  const updateLog = (index: number, field: string, value: any) => {
    const updated = [...exerciseLogs];
    (updated[index] as any)[field] = value;
    setExerciseLogs(updated);
  };

  const allCompleted = exerciseLogs.length > 0 && exerciseLogs.every((l: ExerciseLog, idx: number) => {
    const ex = workout?.exercises?.[idx];
    if (ex?.hasWarmup && !l.warmupCompleted) return false;
    return l.completed;
  });

  const handleComplete = async () => {
    if (!allCompleted) {
      toast.error('Marque todos os exercícios como concluídos.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/aluno/workouts/${workoutId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseLogs: exerciseLogs.map((l: ExerciseLog, idx: number) => {
            const ex = workout?.exercises?.[idx];
            const base: any = {
              exerciseName: l.exerciseName,
              setsCompleted: l.setsCompleted,
              repsCompleted: l.repsCompleted,
              weightUsed: l.weightUsed || null,
            };
            if (ex?.hasWarmup) {
              base.warmupSetsCompleted = l.warmupSetsCompleted;
              base.warmupRepsCompleted = l.warmupRepsCompleted;
              base.warmupWeightUsed = l.warmupWeightUsed || null;
            }
            return base;
          }),
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
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{workout?.workoutName ?? 'Carregando...'}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {workout?.professor?.user?.name ? `Prof. ${workout.professor.user.name}` : ''}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : !workout ? (
          <div className="text-center py-12 text-muted-foreground">Treino não encontrado.</div>
        ) : (
          <>
            {/* Exercises */}
            <div className="space-y-4">
              {(workout?.exercises ?? []).map((ex: any, i: number) => {
                const log = exerciseLogs[i];
                return (
                  <div key={ex?.id ?? i} className={`bg-card rounded-xl p-5 shadow-[var(--shadow-md)] transition-all ${
                    log?.completed ? 'ring-2 ring-emerald-500/30 bg-emerald-50/5' : ''
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <Checkbox
                          checked={log?.completed ?? false}
                          onCheckedChange={(checked: any) => updateLog(i, 'completed', !!checked)}
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${log?.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {ex?.exerciseName ?? 'Exercício'}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{ex?.sets ?? 0} séries × {ex?.reps ?? '-'} reps</span>
                              {ex?.suggestedWeight && <span className="flex items-center gap-1"><Weight className="h-3 w-3" />{ex.suggestedWeight}</span>}
                              {ex?.restTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ex.restTime}</span>}
                            </div>
                            {ex?.notes && <p className="text-xs text-muted-foreground mt-1 italic">{ex.notes}</p>}
                          </div>
                          {log?.completed && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                        </div>

                        {/* Warmup section */}
                        {ex?.hasWarmup && (
                          <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-orange-700 dark:text-orange-400 flex items-center gap-1">
                                <Flame className="h-3 w-3" /> Aquecimento — {ex.warmupSets ?? 0} séries × {ex.warmupReps ?? '-'} reps
                                {ex.warmupWeight && <span className="ml-1">({ex.warmupWeight})</span>}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-orange-600 dark:text-orange-400">{log?.warmupCompleted ? 'Feito' : 'Pendente'}</span>
                                <Checkbox
                                  checked={log?.warmupCompleted ?? false}
                                  onCheckedChange={(checked: any) => updateLog(i, 'warmupCompleted', !!checked)}
                                />
                              </div>
                            </div>
                            {log?.warmupCompleted && (
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs text-orange-700 dark:text-orange-400">Séries</Label>
                                  <Input type="number" min={0} value={log?.warmupSetsCompleted ?? 0}
                                    onChange={(e: any) => updateLog(i, 'warmupSetsCompleted', parseInt(e.target.value) || 0)}
                                    className="h-7 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-orange-700 dark:text-orange-400">Reps</Label>
                                  <Input value={log?.warmupRepsCompleted ?? ''}
                                    onChange={(e: any) => updateLog(i, 'warmupRepsCompleted', e.target.value)}
                                    className="h-7 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-orange-700 dark:text-orange-400">Carga</Label>
                                  <Input value={log?.warmupWeightUsed ?? ''}
                                    onChange={(e: any) => updateLog(i, 'warmupWeightUsed', e.target.value)}
                                    placeholder="kg" className="h-7 text-xs" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Log inputs */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Séries feitas</Label>
                            <Input type="number" min={0} value={log?.setsCompleted ?? 0}
                              onChange={(e: any) => updateLog(i, 'setsCompleted', parseInt(e.target.value) || 0)}
                              className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Reps feitas</Label>
                            <Input value={log?.repsCompleted ?? ''}
                              onChange={(e: any) => updateLog(i, 'repsCompleted', e.target.value)}
                              className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Carga usada</Label>
                            <Input value={log?.weightUsed ?? ''}
                              onChange={(e: any) => updateLog(i, 'weightUsed', e.target.value)}
                              placeholder="kg" className="h-8 text-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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
                  Marque todos os exercícios como concluídos para finalizar.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
