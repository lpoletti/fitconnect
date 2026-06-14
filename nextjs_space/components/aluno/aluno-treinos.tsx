'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { WorkoutForm } from '@/components/professor/workout-form';
import { ImportWorkoutAI } from '@/components/aluno/import-workout-ai';
import {
  LayoutDashboard, ClipboardList, History, Play, Calendar as CalendarIcon,
  Dumbbell, Search, Plus, X, Trash2, FileCheck, Sparkles, EyeOff, Eye, Pencil,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Avaliacoes', href: '/aluno/avaliacoes', icon: FileCheck },
  { label: 'Calendario', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Historico', href: '/aluno/historico', icon: History },
];

export function AlunoTreinos() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'professor' | 'pessoal'>('professor');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingWorkoutId, setPendingWorkoutId] = useState<string | null>(null);

  // Verificar sessao ativa no localStorage
  useEffect(() => {
    function checkPending() {
      try {
        const raw = localStorage.getItem('fitconnect-workout-bkp');
        if (raw) {
          const data = JSON.parse(raw);
          if (data.status === 'active' && data.workoutId) {
            setPendingWorkoutId(data.workoutId);
            return;
          }
        }
      } catch {}
      setPendingWorkoutId(null);
    }
    checkPending();
    window.addEventListener('storage', checkPending);
    return () => window.removeEventListener('storage', checkPending);
  }, []);

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
      if (a.id === pendingWorkoutId) return -1;
      if (b.id === pendingWorkoutId) return 1;
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
        toast.success('Treino excluido!');
        await refreshWorkouts();
      } else if (res.status === 409) {
        toast.error(data?.error ?? 'Treino ja utilizado. Desabilite-o.');
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">Meus Treinos</h1>
              <p className="text-muted-foreground text-sm">Todos os treinos disponiveis para voce.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => { setShowImport(!showImport); if (!showImport) setShowCreate(false); }}
              variant={showImport ? 'outline' : 'default'}
              className={cn(
                'gap-1.5 min-h-[44px] rounded-xl border-border/50',
                !showImport && 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
              )}
            >
              {showImport ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {showImport ? 'Fechar' : 'Importar com IA'}
            </Button>
            <Button
              onClick={() => { setShowCreate(!showCreate); if (!showCreate) setShowImport(false); }}
              variant={showCreate ? 'outline' : 'secondary'}
              className="gap-1.5 min-h-[44px] rounded-xl border-border/50"
            >
              {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showCreate ? 'Cancelar' : 'Criar Manual'}
            </Button>
          </div>
        </div>

        {/* Import with AI */}
        {showImport && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ImportWorkoutAI
              onClose={() => setShowImport(false)}
              onSaved={async () => {
                setShowImport(false);
                setTab('pessoal');
                await refreshWorkouts();
              }}
            />
          </motion.div>
        )}

        {/* Create Personal Workout */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-6 border border-border/50 space-y-4"
          >
            <h2 className="font-sans text-lg font-semibold text-foreground">Novo Treino Pessoal</h2>
            <WorkoutForm
              onSubmit={handleCreateWorkout}
              submitLabel="Criar Treino Pessoal"
              loading={creating}
            />
          </motion.div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/50 rounded-2xl">
          <button
            onClick={() => setTab('professor')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]',
              tab === 'professor'
                ? 'bg-card text-foreground shadow-sm border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            )}>
            <Dumbbell className="h-4 w-4" /> Do Professor ({professorWorkouts.length})
          </button>
          <button
            onClick={() => setTab('pessoal')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]',
              tab === 'pessoal'
                ? 'bg-card text-foreground shadow-sm border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            )}>
            <ClipboardList className="h-4 w-4" /> Pessoais ({personalWorkouts.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar treino..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="pl-10 min-h-[48px] bg-card border-border/50 focus:border-primary/40 rounded-xl"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 border border-border/50 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">
              {searchQuery ? 'Nenhum treino encontrado.' :
                tab === 'professor' ? 'Nenhum treino atribuido pelo professor.' : 'Nenhum treino pessoal criado.'}
            </p>
            {tab === 'pessoal' && !searchQuery && (
              <Button className="mt-4 gap-1.5 bg-primary hover:bg-primary-light" onClick={() => setShowCreate(true)}>
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
              const isPending = w?.id === pendingWorkoutId;
              return (
                <motion.div
                  key={w?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'bg-card rounded-2xl border overflow-hidden transition-all relative',
                    isPending ? 'border-amber-500/60 ring-1 ring-amber-500/20' : 'border-border/50',
                    isInactive ? 'opacity-50' : 'hover:border-border/80'
                  )}
                >
                  {isPending && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-orange-500" />
                  )}
                  <div className="p-4 flex items-center gap-4">
                    <Link
                      href={isInactive ? '#' : `/aluno/treinos/${w?.id}`}
                      className={cn('flex items-center gap-4 flex-1 min-w-0', isInactive && 'pointer-events-none')}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                        isPending ? 'bg-amber-500/15' : isInactive ? 'bg-muted/50' : 'bg-primary/10'
                      )}>
                        {isInactive
                          ? <EyeOff className="h-6 w-6 text-muted-foreground" />
                          : isPending
                            ? <Play className="h-6 w-6 text-amber-400" />
                            : <Play className="h-6 w-6 text-primary" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={cn('font-medium text-foreground truncate flex items-center gap-2', isInactive && 'line-through text-muted-foreground')}>
                          {w?.workoutName ?? 'Treino'}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Em andamento
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {w?.startDate ? format(new Date(w.startDate), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                          </p>
                          {isInactive && (
                            <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">Desabilitado</span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <Badge variant="outline" className="border-primary/20 text-primary bg-primary/10 text-xs">
                          {(w?.exercises ?? []).length} ex.
                        </Badge>
                        {isPersonal ? (
                          <p className="text-[10px] text-muted-foreground mt-1">Pessoal</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-1">Prof. {w?.professor?.user?.name ?? ''}</p>
                        )}
                      </div>
                      {isPersonal && (
                        <div className="flex items-center gap-1">
                          {!isInactive && (
                            <Link href={`/aluno/treinos/${w.id}/editar`} onClick={(e: any) => e.stopPropagation()}>
                              <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            type="button" size="sm" variant="ghost"
                            onClick={(e: any) => { e.preventDefault(); handleToggleWorkout(w.id, w.status); }}
                            className={cn('h-8 w-8 p-0', isInactive ? 'text-primary-light hover:text-primary-light' : 'text-amber-400 hover:text-amber-300')}
                            title={isInactive ? 'Reativar treino' : 'Desabilitar treino'}
                          >
                            {isInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          {!hasLogs && (
                            <Button
                              type="button" size="sm" variant="ghost"
                              onClick={(e: any) => { e.preventDefault(); handleDeleteWorkout(w.id, w.workoutName); }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                              title="Excluir treino"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardShell>
  );
}
