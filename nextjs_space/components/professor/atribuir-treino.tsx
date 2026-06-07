'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { WorkoutForm } from '@/components/professor/workout-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, ClipboardList, ArrowLeft,
  ClipboardCheck, Plus, Dumbbell
} from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/professor/alunos', icon: Users },
  { label: 'Treinos', href: '/professor/treinos', icon: ClipboardList },
];

export function AtribuirTreino({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/professor/workouts')
      .then((r: any) => r.ok ? r.json() : [])
      .then((d: any) => setWorkouts(d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectTemplate = (w: any) => {
    setSelectedWorkout(w);
    setExercises((w?.exercises ?? []).map((ex: any) => ({
      exerciseName: ex?.exerciseName ?? '',
      sets: ex?.sets ?? 3,
      reps: ex?.reps ?? '12',
      suggestedWeight: ex?.suggestedWeight ?? '',
      restTime: ex?.restTime ?? '',
      notes: ex?.notes ?? '',
    })));
  };

  const assignFromTemplate = async () => {
    if (!selectedWorkout || exercises.length === 0) {
      toast.error('Selecione um treino.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/professor/assign-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          workoutName: selectedWorkout.name,
          startDate,
          exercises,
        }),
      });
      if (res.ok) {
        toast.success('Treino atribuído com sucesso!');
        router.push('/professor/alunos');
      } else {
        const d = await res.json();
        toast.error(d?.error ?? 'Erro ao atribuir.');
      }
    } catch {
      toast.error('Erro ao atribuir treino.');
    } finally {
      setSaving(false);
    }
  };

  const assignNewWorkout = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/professor/assign-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          workoutName: data.name,
          startDate,
          exercises: data.exercises,
        }),
      });
      if (res.ok) {
        toast.success('Treino atribuído com sucesso!');
        router.push('/professor/alunos');
      } else {
        const d = await res.json();
        toast.error(d?.error ?? 'Erro ao atribuir.');
      }
    } catch {
      toast.error('Erro ao atribuir treino.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/professor/alunos">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Atribuir Treino</h1>
            <p className="text-muted-foreground text-sm mt-1">Escolha ou crie um treino para o aluno.</p>
          </div>
        </div>

        {/* Date */}
        <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)]">
          <div className="space-y-2 max-w-xs">
            <Label>Data de Início</Label>
            <Input type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg max-w-md">
          <button type="button" onClick={() => setMode('select')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
              mode === 'select' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <ClipboardCheck className="h-4 w-4" /> Do Repositório
          </button>
          <button type="button" onClick={() => { setMode('create'); setSelectedWorkout(null); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
              mode === 'create' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Plus className="h-4 w-4" /> Criar Novo
          </button>
        </div>

        {mode === 'select' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : (workouts ?? []).length === 0 ? (
              <div className="bg-card rounded-xl p-8 shadow-[var(--shadow-md)] text-center">
                <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum treino no repositório.</p>
                <Button className="mt-3" onClick={() => setMode('create')}>Criar Novo</Button>
              </div>
            ) : (
              <>
                <div className="grid gap-3">
                  {(workouts ?? []).map((w: any) => (
                    <div key={w?.id}
                      onClick={() => selectTemplate(w)}
                      className={`bg-card rounded-xl p-4 shadow-[var(--shadow-sm)] cursor-pointer transition-all border-2 ${
                        selectedWorkout?.id === w?.id ? 'border-primary' : 'border-transparent hover:shadow-[var(--shadow-md)]'
                      }`}>
                      <p className="font-medium">{w?.name ?? 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(w?.exercises ?? []).length} exercício(s)</p>
                    </div>
                  ))}
                </div>
                {selectedWorkout && (
                  <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] space-y-3">
                    <h3 className="font-display font-semibold">Exercícios do treino selecionado</h3>
                    <div className="divide-y divide-border">
                      {exercises.map((ex: any, i: number) => (
                        <div key={i} className="py-2 text-sm">
                          <span className="font-medium">{ex?.exerciseName}</span> — {ex?.sets}x{ex?.reps}
                          {ex?.suggestedWeight ? ` (${ex.suggestedWeight})` : ''}
                        </div>
                      ))}
                    </div>
                    <Button onClick={assignFromTemplate} disabled={saving} className="w-full">
                      {saving ? 'Atribuindo...' : 'Atribuir Treino'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <WorkoutForm onSubmit={assignNewWorkout} submitLabel="Atribuir Treino" loading={saving} />
        )}
      </div>
    </DashboardShell>
  );
}
