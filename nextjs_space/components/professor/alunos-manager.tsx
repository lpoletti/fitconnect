'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LayoutDashboard, Users, ClipboardList, UserPlus, Mail,
  CheckCircle, XCircle, User, Ban, RotateCcw
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/professor/alunos', icon: Users },
  { label: 'Treinos', href: '/professor/treinos', icon: ClipboardList },
];

export function AlunosManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/professor/students');
      if (res.ok) setStudents(await res.json());
    } catch {
      toast.error('Erro ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Informe o email do aluno.'); return; }
    setAdding(true);
    try {
      const res = await fetch('/api/professor/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Erro ao cadastrar aluno.');
      } else {
        toast.success(data?.message ?? 'Aluno adicionado!');
        setEmail('');
        fetchStudents();
      }
    } catch {
      toast.error('Erro ao cadastrar aluno.');
    } finally {
      setAdding(false);
    }
  };

  const updateStatus = async (linkId: string, status: string) => {
    try {
      const res = await fetch(`/api/professor/students/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error ?? 'Erro ao atualizar.');
      } else {
        toast.success('Status atualizado!');
        fetchStudents();
      }
    } catch {
      toast.error('Erro ao atualizar.');
    }
  };

  const activeCount = (students ?? []).filter((s: any) => s?.status === 'active')?.length ?? 0;

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Gestão de Alunos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCount}/2 alunos ativos no plano gratuito.
          </p>
        </div>

        {/* Add student form */}
        <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)]">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Cadastrar Aluno
          </h2>
          <form onSubmit={addStudent} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email" placeholder="Email do aluno"
                value={email} onChange={(e: any) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={adding || activeCount >= 2} className="gap-1">
              <UserPlus className="h-4 w-4" /> {adding ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
          {activeCount >= 2 && (
            <p className="text-amber-600 text-xs mt-2">Limite de alunos ativos atingido.</p>
          )}
        </div>

        {/* Students list */}
        <div className="bg-card rounded-xl shadow-[var(--shadow-md)]">
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-lg font-semibold">Alunos Vinculados</h2>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : (students ?? []).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum aluno cadastrado.</p>
              </div>
            ) : (
              (students ?? []).map((link: any) => (
                <div key={link?.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{link?.student?.user?.name ?? 'Aluno'}</p>
                      <p className="text-xs text-muted-foreground">{link?.student?.user?.email ?? ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={link?.status === 'active' ? 'default' : link?.status === 'pending' ? 'secondary' : 'outline'}
                      className={link?.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}>
                      {link?.status === 'active' ? 'Ativo' : link?.status === 'pending' ? 'Pendente' : 'Inativo'}
                    </Badge>
                    {link?.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1 text-emerald-600" onClick={() => updateStatus(link.id, 'active')}>
                          <CheckCircle className="h-3 w-3" /> Aceitar
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => updateStatus(link.id, 'inactive')}>
                          <XCircle className="h-3 w-3" /> Rejeitar
                        </Button>
                      </>
                    )}
                    {link?.status === 'active' && (
                      <>
                        <Link href={`/professor/alunos/${link?.student?.id}/atribuir-treino`}>
                          <Button size="sm" variant="outline" className="gap-1">
                            <ClipboardList className="h-3 w-3" /> Atribuir Treino
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => updateStatus(link.id, 'inactive')}>
                          <Ban className="h-3 w-3" /> Desativar
                        </Button>
                      </>
                    )}
                    {link?.status === 'inactive' && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => updateStatus(link.id, 'active')}>
                        <RotateCcw className="h-3 w-3" /> Reativar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
