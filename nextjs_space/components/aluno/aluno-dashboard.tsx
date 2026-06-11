'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LayoutDashboard, ClipboardList, History, Dumbbell,
  User, Calendar, Trophy, Link2, FileCheck,
  Timer, TrendingUp, ChevronRight, CheckCircle
} from 'lucide-react';
import { WorkoutCard } from '@/components/fitness/workout-card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Avaliacoes', href: '/aluno/avaliacoes', icon: FileCheck },
  { label: 'Calendario', href: '/aluno/calendario', icon: Calendar },
  { label: 'Historico', href: '/aluno/historico', icon: History },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function AlunoDashboard() {
  const { data: session } = useSession() || {};
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [linking, setLinking] = useState(false);

  const fetchData = () => {
    fetch('/api/aluno/dashboard')
      .then((r: any) => r.ok ? r.json() : null)
      .then((d: any) => setData(d))
      .catch(() => toast.error('Erro ao carregar dados.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleLinkProfessor = async () => {
    if (!inviteCode.trim()) {
      toast.error('Informe o codigo do professor.');
      return;
    }
    setLinking(true);
    try {
      const res = await fetch('/api/aluno/link-professor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result?.error ?? 'Erro ao vincular.');
      } else {
        toast.success(result?.message ?? 'Vinculado com sucesso!');
        setInviteCode('');
        setLoading(true);
        fetchData();
      }
    } catch {
      toast.error('Erro ao vincular professor.');
    } finally {
      setLinking(false);
    }
  };

  const workouts = (data?.workouts ?? []).filter((w: any) => w?.status === 'active');
  const recentLogs = data?.recentLogs ?? [];
  const totalCompleted = data?.totalCompleted ?? 0;

  return (
    <DashboardShell navItems={navItems}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-sm">Acompanhe seus treinos e evolucao.</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : data ? (
          <>
            {/* Metric Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Treinos Realizados"
                value={totalCompleted}
                icon={Trophy}
                variant="success"
                trend={{ value: `${Math.min(totalCompleted, 12)}%`, positive: true }}
              />
              <StatCard
                title="Tempo Total Treinado"
                value={data?.totalMinutes ? `${Math.floor(data.totalMinutes / 60)}h${data.totalMinutes % 60}m` : '0h'}
                icon={Timer}
                variant="info"
              />
              <StatCard
                title="Evolucao Semanal"
                value={data?.weeklyProgress ?? '0%'}
                icon={TrendingUp}
                variant={Number(data?.weeklyProgress?.replace('%', '') ?? 0) >= 0 ? 'success' : 'warning'}
              />
              <StatCard
                title="Treinos Ativos"
                value={workouts?.length ?? 0}
                icon={Dumbbell}
                description={data?.professor?.name ?? 'Sem vinculo'}
              />
            </motion.div>

            {/* Link Professor Card - when no professor linked */}
            {!data?.professor && (
              <motion.div variants={itemVariants}>
                <div className="relative bg-card rounded-2xl p-6 border border-dashed border-primary/20 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                  <div className="relative flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                      <Link2 className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-sans font-semibold text-lg text-foreground">Vincular Professor</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tem um codigo de convite? Insira abaixo para vincular com seu professor e comecar a treinar.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Ex: ABC123"
                            value={inviteCode}
                            onChange={(e: any) => setInviteCode(e.target.value.toUpperCase())}
                            className="pl-10 min-h-[48px] font-mono tracking-wider bg-secondary/50 border-border/50 focus:border-primary/50"
                            maxLength={6}
                          />
                        </div>
                        <Button
                          onClick={handleLinkProfessor}
                          disabled={linking || !inviteCode.trim()}
                          className="min-h-[48px] px-6 gap-2 bg-primary hover:bg-primary-light text-white"
                        >
                          <Link2 className="h-4 w-4" />
                          {linking ? 'Vinculando...' : 'Vincular'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Professor Card */}
            {data?.professor && (
              <motion.div variants={itemVariants}>
                <div className="relative bg-card rounded-2xl p-5 border border-border/50 overflow-hidden group hover:border-border/80 transition-all card-hover cursor-default">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                      <User className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Seu Professor</p>
                      <p className="font-sans font-semibold text-lg text-foreground">{data.professor.name}</p>
                      <p className="text-sm text-muted-foreground">{data.professor.specialty}</p>
                    </div>
                    <div className="ml-auto hidden sm:block">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/30" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Active Workouts */}
            <motion.div variants={itemVariants}>
              <div className="relative bg-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="font-sans text-lg font-semibold text-foreground">Treinos Ativos</h2>
                  </div>
                  <Link href="/aluno/treinos">
                    <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground hover:text-foreground">
                      Ver Todos <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
                <div className="divide-y divide-border/30">
                  {workouts.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <Dumbbell className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">Nenhum treino atribuido ainda.</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Seu professor atribuira treinos em breve.</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-4">
                      {workouts.map((w: any) => (
                        <Link key={w?.id} href={`/aluno/treinos/${w?.id}`}>
                          <WorkoutCard
                            name={w?.workoutName ?? 'Treino'}
                            exercises={w?.exercises?.length ?? 0}
                            duration={w?.estimatedDuration ?? 45}
                            difficulty={
                              w?.difficulty === 'beginner' ? 'beginner'
                              : w?.difficulty === 'advanced' ? 'advanced'
                              : 'intermediate'
                            }
                          />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recent History */}
            <motion.div variants={itemVariants}>
              <div className="relative bg-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <History className="h-4 w-4 text-primary-light" />
                    </div>
                    <h2 className="font-sans text-lg font-semibold text-foreground">Historico Recente</h2>
                  </div>
                  <Link href="/aluno/historico">
                    <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground hover:text-foreground">
                      Ver Completo <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
                <div className="divide-y divide-border/30">
                  {recentLogs.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <Trophy className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground font-medium">Nenhum treino concluido ainda.</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Complete seu primeiro treino para ver o historico.</p>
                    </div>
                  ) : (
                    recentLogs.map((log: any) => (
                      <div key={log?.id} className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                          <CheckCircle className="h-4 w-4 text-primary-light" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{log?.assignedWorkout?.workoutName ?? 'Treino'}</p>
                          <p className="text-xs text-muted-foreground">
                            {log?.completedAt ? format(new Date(log.completedAt), "dd/MM/yyyy 'as' HH:mm") : '-'}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                          {(log?.exerciseLogs ?? []).length} exercicios
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div variants={itemVariants} className="text-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">Nao foi possivel carregar os dados.</p>
            <Button onClick={fetchData} variant="outline" className="mt-4">Tentar Novamente</Button>
          </motion.div>
        )}
      </motion.div>
    </DashboardShell>
  );
}
