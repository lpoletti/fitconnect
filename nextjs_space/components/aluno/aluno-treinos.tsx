'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LayoutDashboard, ClipboardList, History, Play, Calendar as CalendarIcon, Dumbbell
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Calendário', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Histórico', href: '/aluno/historico', icon: History },
];

export function AlunoTreinos() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/aluno/dashboard')
      .then((r: any) => r.ok ? r.json() : { workouts: [] })
      .then((d: any) => setWorkouts(d?.workouts ?? []))
      .catch(() => toast.error('Erro ao carregar treinos.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Meus Treinos</h1>
          <p className="text-muted-foreground text-sm mt-1">Todos os treinos atribuídos para você.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : workouts.length === 0 ? (
          <div className="bg-card rounded-xl p-12 shadow-[var(--shadow-md)] text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum treino atribuído ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">Aguarde seu professor atribuir treinos para você.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {workouts.map((w: any) => (
              <Link key={w?.id} href={`/aluno/treinos/${w?.id}`} className="block">
                <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Play className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold">{w?.workoutName ?? 'Treino'}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <CalendarIcon className="h-3 w-3" />
                        Início: {w?.startDate ? format(new Date(w.startDate), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-primary/10 text-primary border-primary/20">{(w?.exercises ?? []).length} exercícios</Badge>
                      <p className="text-xs text-muted-foreground mt-1">Prof. {w?.professor?.user?.name ?? ''}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
