'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { WorkoutForm } from '@/components/professor/workout-form';
import { toast } from 'sonner';
import { LayoutDashboard, Users, ClipboardList, ArrowLeft , CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/professor/alunos', icon: Users },
  { label: 'Treinos', href: '/professor/treinos', icon: ClipboardList },
  { label: 'Meu Plano', href: '/professor/plano', icon: CreditCard },
];

export function EditarTreino({ id }: { id: string }) {
  const router = useRouter();
  const [workout, setWorkout] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/professor/workouts/${id}`)
      .then((r: any) => r.ok ? r.json() : null)
      .then((d: any) => setWorkout(d))
      .catch(() => toast.error('Erro ao carregar treino.'))
      .finally(() => setPageLoading(false));
  }, [id]);

  const handleSubmit = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/professor/workouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success('Treino atualizado!');
        router.push(`/professor/treinos/${id}`);
      } else {
        toast.error('Erro ao atualizar.');
      }
    } catch {
      toast.error('Erro ao atualizar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/professor/treinos/${id}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Editar Treino</h1>
            <p className="text-muted-foreground text-sm mt-1">Atualize as informações do treino.</p>
          </div>
        </div>
        {pageLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : !workout ? (
          <div className="text-center py-12 text-muted-foreground">Treino não encontrado.</div>
        ) : (
          <WorkoutForm
            initialData={{
              name: workout.name ?? '',
              category: workout.category ?? '',
              description: workout.description ?? '',
              exercises: workout.exercises ?? [],
            }}
            onSubmit={handleSubmit}
            submitLabel="Salvar Alterações"
            loading={saving}
          />
        )}
      </div>
    </DashboardShell>
  );
}
