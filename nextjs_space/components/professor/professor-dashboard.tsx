'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LayoutDashboard, Users, ClipboardList, UserPlus, Dumbbell,
  AlertTriangle, CheckCircle, Clock, User
, CreditCard
} from 'lucide-react';

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
      if (studentsRes.ok) setStudents(await studentsRes.json());
    } catch {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const activeCount = (students ?? []).filter((s: StudentLink) => s?.status === 'active')?.length ?? 0;
  const isAtLimit = activeCount >= 2;

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral da sua conta de professor.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Alunos Ativos" value={activeCount} icon={Users}
            description={`Limite: ${stats?.maxStudents ?? 2} alunos`}
            variant={isAtLimit ? 'warning' : 'default'} />
          <StatCard title="Treinos Criados" value={stats?.workoutCount ?? 0} icon={ClipboardList} />
          <StatCard title="Plano Atual" value={(stats?.plan ?? 'free') === 'free' ? 'Gratuito' : 'Pro'} icon={Dumbbell}
            description={isAtLimit ? 'Limite atingido' : 'Até 2 alunos'}
            variant={isAtLimit ? 'warning' : 'success'} />
        </div>

        {/* Limit Warning */}
        {isAtLimit && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">Limite de alunos atingido</p>
              <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">Você atingiu o limite de 2 alunos ativos no plano gratuito.</p>
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="bg-card rounded-xl shadow-[var(--shadow-md)]">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Meus Alunos</h2>
            <Link href="/professor/alunos">
              <Button size="sm" variant="outline" className="gap-1">
                <UserPlus className="h-4 w-4" /> Gerenciar
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : (students ?? []).length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum aluno vinculado ainda.</p>
                <Link href="/professor/alunos">
                  <Button size="sm" className="mt-3 gap-1"><UserPlus className="h-4 w-4" /> Cadastrar Aluno</Button>
                </Link>
              </div>
            ) : (
              (students ?? []).map((link: StudentLink) => (
                <div key={link?.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{link?.student?.user?.name ?? 'Aluno'}</p>
                    <p className="text-xs text-muted-foreground">{link?.student?.user?.email ?? ''}</p>
                  </div>
                  <Badge variant={link?.status === 'active' ? 'default' : link?.status === 'pending' ? 'secondary' : 'outline'}
                    className={link?.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}>
                    {link?.status === 'active' ? 'Ativo' : link?.status === 'pending' ? 'Pendente' : 'Inativo'}
                  </Badge>
                  {link?.status === 'active' && (
                    <Link href={`/professor/alunos/${link?.student?.id}/atribuir-treino`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <ClipboardList className="h-3 w-3" /> Treino
                      </Button>
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
