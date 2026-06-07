'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { WorkoutForm } from '@/components/professor/workout-form';
import { toast } from 'sonner';
import { LayoutDashboard, Users, ClipboardList, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/professor/alunos', icon: Users },
  { label: 'Treinos', href: '/professor/treinos', icon: ClipboardList },
];

export function NovoTreino() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/professor/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success('Treino criado com sucesso!');
        router.push('/professor/treinos');
      } else {
        const d = await res.json();
        toast.error(d?.error ?? 'Erro ao criar treino.');
      }
    } catch {
      toast.error('Erro ao criar treino.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/professor/treinos">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Novo Treino</h1>
            <p className="text-muted-foreground text-sm mt-1">Crie um novo treino para seu repositório.</p>
          </div>
        </div>
        <WorkoutForm onSubmit={handleSubmit} submitLabel="Criar Treino" loading={loading} />
      </div>
    </DashboardShell>
  );
}
