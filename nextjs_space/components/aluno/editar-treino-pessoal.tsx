'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { WorkoutForm } from '@/components/professor/workout-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LayoutDashboard, ClipboardList, History, ArrowLeft, Calendar as CalendarIcon, FileCheck
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Avaliações', href: '/aluno/avaliacoes', icon: FileCheck },
  { label: 'Calendário', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Histórico', href: '/aluno/historico', icon: History },
];

export function EditarTreinoPessoal({ id }: { id: string }) {
  const router = useRouter();
  const [workout, setWorkout] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/aluno/workouts/${id}`)
      .then((r: any) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((d: any) => {
        if (!d?.isPersonal) {
          toast.error('Apenas treinos pessoais podem ser editados.');
          router.push('/aluno/treinos');
          return;
        }
        setWorkout(d);
      })
      .catch(() => {
        toast.error('Treino não encontrado.');
        router.push('/aluno/treinos');
      })
      .finally(() => setPageLoading(false));
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/aluno/workouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success('Treino atualizado!');
        router.push(`/aluno/treinos/${id}`);
      } else {
        const d = await res.json();
        toast.error(d?.error ?? 'Erro ao atualizar.');
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
          <Link href={`/aluno/treinos/${id}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Editar Treino</h1>
            <p className="text-muted-foreground text-sm mt-1">Atualize os exercícios e configurações do seu treino pessoal.</p>
          </div>
        </div>
        {pageLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : !workout ? (
          <div className="text-center py-12 text-muted-foreground">Treino não encontrado.</div>
        ) : (
          <WorkoutForm
            initialData={{
              name: workout.workoutName ?? '',
              category: '',
              description: '',
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
