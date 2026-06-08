'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { WorkoutForm } from '@/components/professor/workout-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, ClipboardList, ArrowLeft,
  ClipboardCheck, Plus, Dumbbell, Check, X
, CreditCard
} from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/professor/alunos', icon: Users },
  { label: 'Treinos', href: '/professor/treinos', icon: ClipboardList },
  { label: 'Meu Plano', href: '/professor/plano', icon: CreditCard },
];

export function AtribuirTreino({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/professor/workouts')
      .then((r: any) => r.ok ? r.json() : [])
      .then((d: any) => setWorkouts(d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleWorkout = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === workouts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(workouts.map(w => w.id)));
    }
  };

  const assignFromTemplates = async () => {
    if (selectedIds.size === 0) {
      toast.error('Selecione pelo menos um treino.');
      return;
    }
    setSaving(true);
    try {
      const selectedWorkouts = workouts.filter(w => selectedIds.has(w.id));
      const payload = {
        studentId,
        workouts: selectedWorkouts.map(w => ({
          workoutName: w.name,
          startDate,
          exercises: (w.exercises ?? []).map((ex: any) => ({
            exerciseName: ex?.exerciseName ?? '',
            sets: ex?.sets ?? 3,
            reps: ex?.reps ?? '12',
            suggestedWeight: ex?.suggestedWeight ?? '',
            restTime: ex?.restTime ?? '',
            notes: ex?.notes ?? '',
            hasWarmup: ex?.hasWarmup ?? false,
            setsConfig: ex?.setsConfig ?? null,
            warmupConfig: ex?.warmupConfig ?? null,
            mediaUrl: ex?.mediaUrl ?? null,
            mediaType: ex?.mediaType ?? null,
            mediaPath: ex?.mediaPath ?? null,
          })),
        })),
      };
      const res = await fetch('/api/professor/assign-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`${selectedIds.size} treino(s) atribuído(s) com sucesso!`);
        router.push('/professor/alunos');
      } else {
        const d = await res.json();
        toast.error(d?.error ?? 'Erro ao atribuir.');
      }
    } catch {
      toast.error('Erro ao atribuir treinos.');
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
            <p className="text-muted-foreground text-sm mt-1">Escolha um ou mais treinos para o aluno.</p>
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
          <button type="button" onClick={() => setMode('create')}
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
                {/* Select all + counter */}
                <div className="flex items-center justify-between">
                  <button type="button" onClick={selectAll}
                    className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                    {selectedIds.size === workouts.length ? (
                      <><X className="h-3.5 w-3.5" /> Desmarcar todos</>
                    ) : (
                      <><Check className="h-3.5 w-3.5" /> Selecionar todos</>
                    )}
                  </button>
                  {selectedIds.size > 0 && (
                    <Badge variant="secondary">{selectedIds.size} selecionado(s)</Badge>
                  )}
                </div>

                <div className="grid gap-3">
                  {(workouts ?? []).map((w: any) => {
                    const isSelected = selectedIds.has(w.id);
                    return (
                      <div key={w?.id}
                        onClick={() => toggleWorkout(w.id)}
                        className={`bg-card rounded-xl p-4 shadow-[var(--shadow-sm)] cursor-pointer transition-all border-2 flex items-center gap-3 ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:shadow-[var(--shadow-md)]'
                        }`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{w?.name ?? 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(w?.exercises ?? []).length} exercício(s)
                            {w?.category ? ` • ${w.category}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedIds.size > 0 && (
                  <Button onClick={assignFromTemplates} disabled={saving} className="w-full" size="lg">
                    {saving ? 'Atribuindo...' : `Atribuir ${selectedIds.size} Treino(s)`}
                  </Button>
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