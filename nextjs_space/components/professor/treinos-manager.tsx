'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LayoutDashboard, Users, ClipboardList, Plus, Copy, Trash2,
  Eye, Edit, Dumbbell, Tag, Search, CreditCard
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/professor/alunos', icon: Users },
  { label: 'Treinos', href: '/professor/treinos', icon: ClipboardList },
  { label: 'Meu Plano', href: '/professor/plano', icon: CreditCard },
];

export function TreinosManager() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchWorkouts(); }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await fetch('/api/professor/workouts');
      if (res.ok) setWorkouts(await res.json());
    } catch {
      toast.error('Erro ao carregar treinos.');
    } finally {
      setLoading(false);
    }
  };

  const duplicateWorkout = async (id: string) => {
    try {
      const res = await fetch(`/api/professor/workouts/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        toast.success('Treino duplicado!');
        fetchWorkouts();
      } else {
        toast.error('Erro ao duplicar.');
      }
    } catch {
      toast.error('Erro ao duplicar.');
    }
  };

  const deleteWorkout = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este treino?')) return;
    try {
      const res = await fetch(`/api/professor/workouts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Treino excluído!');
        fetchWorkouts();
      } else {
        toast.error('Erro ao excluir.');
      }
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Repositório de Treinos</h1>
            <p className="text-muted-foreground text-sm mt-1">{(workouts ?? []).length} treino(s) criado(s)</p>
          </div>
          <Link href="/professor/treinos/novo">
            <Button className="gap-1"><Plus className="h-4 w-4" /> Novo Treino</Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar treino por nome ou categoria..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : (workouts ?? []).filter((w: any) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (w?.name ?? '').toLowerCase().includes(q) || (w?.category ?? '').toLowerCase().includes(q);
          }).length === 0 ? (
          <div className="bg-card rounded-xl p-12 shadow-[var(--shadow-md)] text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{searchQuery ? 'Nenhum treino encontrado.' : 'Nenhum treino criado ainda.'}</p>
            {!searchQuery && (
              <Link href="/professor/treinos/novo">
                <Button className="mt-4 gap-1"><Plus className="h-4 w-4" /> Criar Primeiro Treino</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {(workouts ?? []).filter((w: any) => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return (w?.name ?? '').toLowerCase().includes(q) || (w?.category ?? '').toLowerCase().includes(q);
            }).map((w: any) => (
              <div key={w?.id} className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <h3 className="font-display text-lg font-semibold">{w?.name ?? 'Sem nome'}</h3>
                    </div>
                    {w?.category && (
                      <Badge variant="secondary" className="mt-1 gap-1">
                        <Tag className="h-3 w-3" /> {w.category}
                      </Badge>
                    )}
                    {w?.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{w.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {(w?.exercises ?? []).length} exercício(s)
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/professor/treinos/${w?.id}`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="h-3 w-3" /> Ver
                      </Button>
                    </Link>
                    <Link href={`/professor/treinos/${w?.id}/editar`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Edit className="h-3 w-3" /> Editar
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => duplicateWorkout(w?.id)}>
                      <Copy className="h-3 w-3" /> Duplicar
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => deleteWorkout(w?.id)}>
                      <Trash2 className="h-3 w-3" /> Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
