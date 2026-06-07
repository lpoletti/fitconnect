'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LayoutDashboard, ClipboardList, History, Dumbbell,
  User, Calendar, Play, CheckCircle, Trophy
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Histórico', href: '/aluno/historico', icon: History },
];

export function AlunoDashboard() {
  const { data: session } = useSession() || {};
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/aluno/dashboard')
      .then((r: any) => r.ok ? r.json() : null)
      .then((d: any) => setData(d))
      .catch(() => toast.error('Erro ao carregar dados.'))
      .finally(() => setLoading(false));
  }, []);

  const workouts = data?.workouts ?? [];
  const recentLogs = data?.recentLogs ?? [];

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe seus treinos e evolução.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Treinos Ativos" value={workouts?.length ?? 0} icon={Dumbbell} />
              <StatCard title="Treinos Concluídos" value={data?.totalCompleted ?? 0} icon={Trophy} variant="success" />
              <StatCard title="Professor" value={data?.professor?.name ?? 'Sem vínculo'} icon={User}
                description={data?.professor?.specialty ?? ''} />
            </div>

            {/* Professor Card */}
            {data?.professor && (
              <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-semibold">{data.professor.name}</p>
                    <p className="text-sm text-muted-foreground">{data.professor.specialty}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Active Workouts */}
            <div className="bg-card rounded-xl shadow-[var(--shadow-md)]">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Treinos Ativos</h2>
                <Link href="/aluno/treinos">
                  <Button size="sm" variant="outline">Ver Todos</Button>
                </Link>
              </div>
              <div className="divide-y divide-border">
                {workouts.length === 0 ? (
                  <div className="p-8 text-center">
                    <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhum treino atribuído ainda.</p>
                  </div>
                ) : (
                  workouts.map((w: any) => (
                    <Link key={w?.id} href={`/aluno/treinos/${w?.id}`} className="block">
                      <div className="p-4 hover:bg-muted/50 transition-colors flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Play className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{w?.workoutName ?? 'Treino'}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Início: {w?.startDate ? format(new Date(w.startDate), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20">{(w?.exercises ?? []).length} exercícios</Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Recent History */}
            <div className="bg-card rounded-xl shadow-[var(--shadow-md)]">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Histórico Recente</h2>
                <Link href="/aluno/historico">
                  <Button size="sm" variant="outline">Ver Completo</Button>
                </Link>
              </div>
              <div className="divide-y divide-border">
                {recentLogs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum treino concluído ainda.</p>
                  </div>
                ) : (
                  recentLogs.map((log: any) => (
                    <div key={log?.id} className="p-4 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log?.assignedWorkout?.workoutName ?? 'Treino'}</p>
                        <p className="text-xs text-muted-foreground">
                          {log?.completedAt ? format(new Date(log.completedAt), "dd/MM/yyyy 'às' HH:mm") : '-'}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">{(log?.exerciseLogs ?? []).length} exercícios</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
