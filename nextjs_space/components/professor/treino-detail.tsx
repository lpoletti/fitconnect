'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LayoutDashboard, Users, ClipboardList, ArrowLeft, Edit,
  Dumbbell, Tag, Clock, Weight
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/professor/alunos', icon: Users },
  { label: 'Treinos', href: '/professor/treinos', icon: ClipboardList },
];

export function TreinoDetail({ id }: { id: string }) {
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/professor/workouts/${id}`)
      .then((r: any) => r.ok ? r.json() : null)
      .then((d: any) => setWorkout(d))
      .catch(() => toast.error('Erro ao carregar treino.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/professor/treinos">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold tracking-tight">{workout?.name ?? 'Carregando...'}</h1>
            {workout?.category && (
              <Badge variant="secondary" className="mt-1 gap-1"><Tag className="h-3 w-3" /> {workout.category}</Badge>
            )}
          </div>
          {workout && (
            <Link href={`/professor/treinos/${id}/editar`}>
              <Button size="sm" className="gap-1"><Edit className="h-4 w-4" /> Editar</Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : !workout ? (
          <div className="text-center py-12 text-muted-foreground">Treino não encontrado.</div>
        ) : (
          <>
            {workout?.description && (
              <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)]">
                <p className="text-muted-foreground">{workout.description}</p>
              </div>
            )}
            <div className="bg-card rounded-xl shadow-[var(--shadow-md)]">
              <div className="p-4 border-b border-border">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" /> Exercícios ({(workout?.exercises ?? []).length})
                </h2>
              </div>
              <div className="divide-y divide-border">
                {(workout?.exercises ?? []).map((ex: any, i: number) => (
                  <div key={ex?.id ?? i} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{i + 1}</span>
                        <div>
                          <p className="font-medium">{ex?.exerciseName ?? 'Exercício'}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{ex?.sets ?? 0} séries</span>
                            <span>{ex?.reps ?? '-'} reps</span>
                            {ex?.suggestedWeight && <span className="flex items-center gap-1"><Weight className="h-3 w-3" />{ex.suggestedWeight}</span>}
                            {ex?.restTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ex.restTime}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    {ex?.notes && <p className="text-xs text-muted-foreground mt-2 ml-11">{ex.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
