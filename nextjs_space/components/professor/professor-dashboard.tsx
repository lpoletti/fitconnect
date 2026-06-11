'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LayoutDashboard, Users, ClipboardList, UserPlus, Dumbbell,
  AlertTriangle, CheckCircle, User, CreditCard, ChevronRight,
  TrendingUp, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/professor/alunos', icon: Users },
  { label: 'Treinos', href: '/professor/treinos', icon: ClipboardList },
  { label: 'Meu Plano', href: '/professor/plano', icon: CreditCard },
];

interface StudentLink {
  id: string;
  status: string;
  student: {
    id: string;
    user: { name: string; email: string };
  };
  lastWorkout?: string | null;
}

export function ProfessorDashboard() {
  const { data: session } = useSession() || {};
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<StudentLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        fetch('/api/professor/stats'),
        fetch('/api/professor/students'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (studentsRes.ok) {
        const sData = await studentsRes.json();
        setStudents(sData?.students ?? sData ?? []);
      }
    } catch {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const activeCount = (students ?? []).filter((s: StudentLink) => s?.status === 'active')?.length ?? 0;
  const maxStudents = stats?.maxStudents ?? 2;
  const isAtLimit = activeCount >= maxStudents;

  return (
    <DashboardShell navItems={navItems}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-[#10B981]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Visao geral da sua conta de professor.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Alunos Ativos" value={activeCount} icon={Users}
                description={`Limite: ${stats?.maxStudents ?? 2} alunos`}
                variant={isAtLimit ? 'warning' : 'default'} />
              <StatCard title="Treinos Criados" value={stats?.workoutCount ?? 0} icon={ClipboardList} />
              <StatCard title="Plano Atual" value={(stats?.plan ?? 'free') === 'free' ? 'Gratuito' : 'Pro'} icon={Dumbbell}
                description={isAtLimit ? 'Limite atingido' : `Ate ${maxStudents} alunos`}
                variant={isAtLimit ? 'warning' : 'success'} />
            </div>

            {/* Limit Warning */}
            {isAtLimit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/8 border border-amber-500/15 rounded-2xl p-5 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Limite de alunos atingido</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Voce atingiu o limite de {maxStudents} alunos ativos no seu plano atual.
                    {' '}<Link href="/professor/plano" className="text-[#10B981] hover:text-[#34D399] underline underline-offset-2">Faca upgrade</Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Students List */}
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
                    <Users className="h-4 w-4 text-[#10B981]" />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-foreground">Meus Alunos</h2>
                </div>
                <Link href="/professor/alunos">
                  <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground hover:text-foreground">
                    Gerenciar <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <div className="divide-y divide-border/30">
                {(students ?? []).length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground font-medium">Nenhum aluno vinculado ainda.</p>
                    <Link href="/professor/alunos">
                      <Button size="sm" className="mt-4 gap-1.5 bg-[#10B981] hover:bg-[#34D399]">
                        <UserPlus className="h-4 w-4" /> Cadastrar Aluno
                      </Button>
                    </Link>
                  </div>
                ) : (
                  (students ?? []).map((link: StudentLink) => (
                    <div key={link?.id} className="p-4 flex items-center gap-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <div className="w-11 h-11 rounded-2xl bg-[rgba(16,185,129,0.12)] flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-[#10B981]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{link?.student?.user?.name ?? 'Aluno'}</p>
                        <p className="text-xs text-muted-foreground">{link?.student?.user?.email ?? ''}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        'text-xs font-medium',
                        link?.status === 'active'
                          ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.2)]'
                          : link?.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-muted/30 text-muted-foreground border-border/30'
                      )}>
                        {link?.status === 'active' ? 'Ativo' : link?.status === 'pending' ? 'Pendente' : 'Inativo'}
                      </Badge>
                      {link?.status === 'active' && (
                        <Link href={`/professor/alunos/${link?.student?.id}/atribuir-treino`}>
                          <Button size="sm" variant="outline" className="gap-1.5 border-border/50 hover:bg-[rgba(16,185,129,0.1)] hover:border-[rgba(16,185,129,0.3)]">
                            <ClipboardList className="h-3 w-3" /> Treino
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </DashboardShell>
  );
}
