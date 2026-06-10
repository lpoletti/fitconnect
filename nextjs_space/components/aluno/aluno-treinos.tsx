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
import { ImportWorkoutAI } from '@/components/aluno/import-workout-ai';
import {
  LayoutDashboard, ClipboardList, History, Play, Calendar as CalendarIcon,
  Dumbbell, Search, Plus, X, Trash2, FileCheck, Sparkles, EyeOff, Eye, Pencil
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
  const [showImport, setShowImport] = useState(false);
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

  const filteredWorkouts = currentList
    .filter((w: any) => {
      if (!searchQuery) return true;
      return (w?.workoutName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a: any, b: any) => {
      // Active workouts first, inactive last
      if (a.status === 'inactive' && b.status !== 'inactive') return 1;
      if (a.status !== 'inactive' && b.status === 'inactive') return -1;
      return 0;
    });

  const handleDeleteWorkout = async (workoutId: string, workoutName: string) => {
    if (!confirm(`Excluir o treino "${workoutName}" permanentemente?`)) return;
    try {
      const res = await fetch(`/api/aluno/workouts/${workoutId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Treino excluído!');
        await refreshWorkouts();
      } else if (res.status === 409) {
        toast.error(data?.error ?? 'Treino já utilizado. Desabilite-o.');
      } else {
        toast.error(data?.error ?? 'Erro ao excluir.');
      }
    } catch {
      toast.error('Erro ao excluir treino.');
    }
  };

  const handleToggleWorkout = async (workoutId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/aluno/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(newStatus === 'active' ? 'Treino reativado!' : 'Treino desabilitado!');
        await refreshWorkouts();
      } else {
        const data = await res.json();
        toast.error(data?.error ?? 'Erro ao atualizar.');
      }
    } catch {
      toast.error('Erro ao atualizar treino.');
    }
  };

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
          <div className="flex items-center gap-2">
            <Button
              onClick={() => { setShowImport(!showImport); if (!showImport) setShowCreate(false); }}
              variant={showImport ? 'outline' : 'default'}
              className={`gap-1 min-h-[44px] ${!showImport ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''}`}
            >
              {showImport ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {showImport ? 'Fechar' : 'Importar com IA'}
            </Button>
            <Button
              onClick={() => { setShowCreate(!showCreate); if (!showCreate) setShowImport(false); }}
              variant={showCreate ? 'outline' : 'secondary'}
              className="gap-1 min-h-[44px]"
            >
              {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showCreate ? 'Cancelar' : 'Criar Manual'}
            </Button>
          </div>
        </div>

        {/* Import with AI */}
        {showImport && (
          <ImportWorkoutAI
            onClose={() => setShowImport(false)}
            onSaved={async () => {
              setShowImport(false);
              setTab('pessoal');
              await refreshWorkouts();
            }}
          />
        )}

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
            {filteredWorkouts.map((w: any) => {
              const isInactive = w?.status === 'inactive';
              const isPersonal = w?.isPersonal;
              const hasLogs = (w?._count?.workoutLogs ?? 0) > 0;
              return (
                <div key={w?.id} className={cn('bg-card rounded-xl p-5 shadow-[var(--shadow-md)] transition-all', isInactive ? 'opacity-60' : 'hover:shadow-[var(--shadow-lg)]')}>
                  <div className="flex items-center gap-4">
                    <Link href={isInactive ? '#' : `/aluno/treinos/${w?.id}`} className={cn('flex items-center gap-4 flex-1 min-w-0', isInactive && 'pointer-events-none')}>
                      <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', isInactive ? 'bg-muted' : 'bg-primary/10')}>
                        {isInactive ? <EyeOff className="h-6 w-6 text-muted-foreground" /> : <Play className="h-6 w-6 text-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={cn('font-display font-semibold truncate', isInactive && 'line-through text-muted-foreground')}>
                          {w?.workoutName ?? 'Treino'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {w?.startDate ? format(new Date(w.startDate), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                          </p>
                          {isInactive && (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">Desabilitado</span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <Badge className="bg-primary/10 text-primary border-primary/20">{(w?.exercises ?? []).length} ex.</Badge>
                        {isPersonal ? (
                          <p className="text-xs text-muted-foreground mt-1">Pessoal</p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">Prof. {w?.professor?.user?.name ?? ''}</p>
                        )}
                      </div>
                      {isPersonal && (
                        <div className="flex items-center gap-1">
                          {!isInactive && (
                            <Link href={`/aluno/treinos/${w.id}/editar`} onClick={(e: any) => e.stopPropagation()}>
                              <Button
                                type="button" size="sm" variant="ghost"
                                className="h-8 w-8 p-0 text-primary hover:text-primary"
                                title="Editar treino"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            type="button" size="sm" variant="ghost"
                            onClick={(e: any) => { e.preventDefault(); handleToggleWorkout(w.id, w.status); }}
                            className={cn('h-8 w-8 p-0', isInactive ? 'text-green-600 hover:text-green-700' : 'text-amber-500 hover:text-amber-600')}
                            title={isInactive ? 'Reativar treino' : 'Desabilitar treino'}
                          >
                            {isInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          {!hasLogs && (
                            <Button
                              type="button" size="sm" variant="ghost"
                              onClick={(e: any) => { e.preventDefault(); handleDeleteWorkout(w.id, w.workoutName); }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Excluir treino"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
