'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LayoutDashboard, Users, ClipboardList, UserPlus, Mail,
  CheckCircle, XCircle, User, Ban, RotateCcw, Search,
  Copy, Clock, CreditCard, Link2, ClipboardCheck
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/professor/alunos', icon: Users },
  { label: 'Treinos', href: '/professor/treinos', icon: ClipboardList },
  { label: 'Meu Plano', href: '/professor/plano', icon: CreditCard },
];

export function AlunosManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [studentsRes, statsRes, inviteRes] = await Promise.all([
        fetch('/api/professor/students'),
        fetch('/api/professor/stats'),
        fetch('/api/professor/invite-code'),
      ]);
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data?.students ?? data ?? []);
        setPendingInvites(data?.pendingInvites ?? []);
      }
      if (statsRes.ok) setStats(await statsRes.json());
      if (inviteRes.ok) {
        const invData = await inviteRes.json();
        setInviteCode(invData?.inviteCode ?? '');
      }
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
        fetchAll();
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
        fetchAll();
      }
    } catch {
      toast.error('Erro ao atualizar.');
    }
  };

  const cancelInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/professor/pending-invites/${inviteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Convite cancelado.');
        fetchAll();
      } else {
        toast.error('Erro ao cancelar convite.');
      }
    } catch {
      toast.error('Erro ao cancelar convite.');
    }
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast.success('Código copiado!');
    }
  };

  const activeCount = (students ?? []).filter((s: any) => s?.status === 'active')?.length ?? 0;
  const maxStudents = stats?.maxStudents ?? 2;
  const planName = stats?.planName ?? 'Grátis';

  const filteredStudents = (students ?? []).filter((link: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (link?.student?.user?.name ?? '').toLowerCase().includes(q) ||
      (link?.student?.user?.email ?? '').toLowerCase().includes(q);
  });

  const filteredPending = (pendingInvites ?? []).filter((inv: any) => {
    if (!searchQuery) return true;
    return (inv?.email ?? '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Gestão de Alunos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCount}/{maxStudents} alunos ativos no plano {planName}.
          </p>
        </div>

        {/* Invite Code */}
        {inviteCode && (
          <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-3 flex-wrap">
              <Link2 className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Código de Convite</p>
                <p className="text-xs text-muted-foreground">Compartilhe este código para seus alunos se vincularem a você.</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-1.5 rounded-lg font-mono text-sm font-bold tracking-widest">{inviteCode}</code>
                <Button size="sm" variant="outline" onClick={copyInviteCode} className="gap-1">
                  <Copy className="h-3 w-3" /> Copiar
                </Button>
              </div>
            </div>
          </div>
        )}

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
            <Button type="submit" disabled={adding || activeCount >= maxStudents} className="gap-1 min-h-[44px]">
              <UserPlus className="h-4 w-4" /> {adding ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
          {activeCount >= maxStudents && (
            <p className="text-amber-600 text-xs mt-2">Limite de {maxStudents} alunos ativos atingido no plano {planName}.</p>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno por nome ou email..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Pending Invites */}
        {filteredPending.length > 0 && (
          <div className="bg-card rounded-xl shadow-[var(--shadow-md)]">
            <div className="p-4 border-b border-border">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Convites Pendentes
              </h2>
            </div>
            <div className="divide-y divide-border">
              {filteredPending.map((inv: any) => (
                <div key={inv?.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{inv?.email}</p>
                      <p className="text-xs text-muted-foreground">Aguardando cadastro</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      Pendente
                    </Badge>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive min-h-[36px]" onClick={() => cancelInvite(inv.id)}>
                      <XCircle className="h-3 w-3" /> Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students list */}
        <div className="bg-card rounded-xl shadow-[var(--shadow-md)]">
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-lg font-semibold">Alunos Vinculados</h2>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{searchQuery ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado.'}</p>
              </div>
            ) : (
              filteredStudents.map((link: any) => (
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
                        <Button size="sm" variant="outline" className="gap-1 text-emerald-600 min-h-[36px]" onClick={() => updateStatus(link.id, 'active')}>
                          <CheckCircle className="h-3 w-3" /> Aceitar
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-destructive min-h-[36px]" onClick={() => updateStatus(link.id, 'inactive')}>
                          <XCircle className="h-3 w-3" /> Rejeitar
                        </Button>
                      </>
                    )}
                    {link?.status === 'active' && (
                      <>
                        <Link href={`/professor/alunos/${link?.student?.id}/atribuir-treino`}>
                          <Button size="sm" variant="outline" className="gap-1 min-h-[36px]">
                            <ClipboardList className="h-3 w-3" /> Atribuir Treino
                          </Button>
                        </Link>
                        <Link href={`/professor/alunos/${link?.student?.id}/avaliacao`}>
                          <Button size="sm" variant="outline" className="gap-1 min-h-[36px]">
                            <ClipboardCheck className="h-3 w-3" /> Avaliar
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" className="gap-1 text-destructive min-h-[36px]" onClick={() => updateStatus(link.id, 'inactive')}>
                          <Ban className="h-3 w-3" /> Desativar
                        </Button>
                      </>
                    )}
                    {link?.status === 'inactive' && (
                      <Button size="sm" variant="outline" className="gap-1 min-h-[36px]" onClick={() => updateStatus(link.id, 'active')}>
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
