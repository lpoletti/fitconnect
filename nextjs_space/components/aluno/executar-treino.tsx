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
  Dumbbell, Clock, Weight, CheckCircle, Trophy
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

  const allCompleted = exerciseLogs.length > 0 && exerciseLogs.every((l: ExerciseLog) => l.completed);

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
          exerciseLogs: exerciseLogs.map((l: ExerciseLog) => ({
            exerciseName: l.exerciseName,
            setsCompleted: l.setsCompleted,
            repsCompleted: l.repsCompleted,
            weightUsed: l.weightUsed || null,
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
