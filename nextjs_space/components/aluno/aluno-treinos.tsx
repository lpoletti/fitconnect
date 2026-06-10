'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { WorkoutForm } from '@/components/professor/workout-form';
import {
  LayoutDashboard, ClipboardList, History, Play, Calendar as CalendarIcon,
  Dumbbell, Search, Plus, X, Trash2, FileCheck
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Avaliações', href: '/aluno/avaliacoes', icon: FileCheck },
  { label: 'Calendário', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Histórico', href: '/aluno/historico', icon: History },
];

export function AlunoTreinos() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'professor' | 'pessoal'>('professor');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const refreshWorkouts = async () => {
    const dashRes = await fetch('/api/aluno/dashboard');
    if (dashRes.ok) {
      const d = await dashRes.json();
      setWorkouts(d?.workouts ?? []);
    }
  };

  useEffect(() => {
    fetch('/api/aluno/dashboard')
      .then((r: any) => r.ok ? r.json() : { workouts: [] })
      .then((d: any) => setWorkouts(d?.workouts ?? []))
      .catch(() => toast.error('Erro ao carregar treinos.'))
      .finally(() => setLoading(false));
  }, []);

  const professorWorkouts = (workouts ?? []).filter((w: any) => !w?.isPersonal);
  const personalWorkouts = (workouts ?? []).filter((w: any) => w?.isPersonal);
  const currentList = tab === 'professor' ? professorWorkouts : personalWorkouts;

  const filteredWorkouts = currentList.filter((w: any) => {
    if (!searchQuery) return true;
    return (w?.workoutName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreateWorkout = async (data: any) => {
    setCreating(true);
    try {
      const res = await fetch('/api/aluno/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutName: data.name,
          category: data.category,
          description: data.description,
          exercises: data.exercises,
        }),
      });
      if (res.ok) {
        toast.success('Treino pessoal criado!');
        setShowCreate(false);
        setTab('pessoal');
        await refreshWorkouts();
      } else {
        const d = await res.json();
        toast.error(d?.error ?? 'Erro ao criar treino.');
      }
    } catch {
      toast.error('Erro ao criar treino.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Meus Treinos</h1>
            <p className="text-muted-foreground text-sm mt-1">Todos os treinos disponíveis para você.</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-1 min-h-[44px]">
            {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreate ? 'Cancelar' : 'Criar Treino'}
          </Button>
        </div>

        {/* Create Personal Workout */}
        {showCreate && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Novo Treino Pessoal</h2>
            <WorkoutForm
              onSubmit={handleCreateWorkout}
              submitLabel="Criar Treino Pessoal"
              loading={creating}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setTab('professor')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all min-h-[44px]',
              tab === 'professor' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>
            <Dumbbell className="h-4 w-4" /> Do Professor ({professorWorkouts.length})
          </button>
          <button
            onClick={() => setTab('pessoal')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all min-h-[44px]',
              tab === 'pessoal' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>
            <ClipboardList className="h-4 w-4" /> Pessoais ({personalWorkouts.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar treino..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="bg-card rounded-xl p-12 shadow-[var(--shadow-md)] text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Nenhum treino encontrado.' :
                tab === 'professor' ? 'Nenhum treino atribuído pelo professor.' : 'Nenhum treino pessoal criado.'}
            </p>
            {tab === 'pessoal' && !searchQuery && (
              <Button className="mt-3 gap-1 min-h-[44px]" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> Criar Primeiro Treino
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredWorkouts.map((w: any) => (
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
                      {w?.isPersonal ? (
                        <p className="text-xs text-muted-foreground mt-1">Treino pessoal</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">Prof. {w?.professor?.user?.name ?? ''}</p>
                      )}
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
