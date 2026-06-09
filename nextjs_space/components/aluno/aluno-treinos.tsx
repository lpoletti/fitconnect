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

interface NewExercise {
  exerciseName: string;
  sets: number;
  reps: string;
  restTime: string;
}

export function AlunoTreinos() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'professor' | 'pessoal'>('professor');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newExercises, setNewExercises] = useState<NewExercise[]>([
    { exerciseName: '', sets: 3, reps: '12', restTime: '60s' },
  ]);

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

  const addExercise = () => {
    setNewExercises([...newExercises, { exerciseName: '', sets: 3, reps: '12', restTime: '60s' }]);
  };

  const removeExercise = (idx: number) => {
    if (newExercises.length <= 1) return;
    setNewExercises(newExercises.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx: number, field: string, value: any) => {
    const updated = [...newExercises];
    (updated[idx] as any)[field] = value;
    setNewExercises(updated);
  };

  const createWorkout = async () => {
    if (!newName.trim()) { toast.error('Informe o nome do treino.'); return; }
    if (newExercises.some(ex => !ex.exerciseName.trim())) {
      toast.error('Preencha o nome de todos os exercícios.'); return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/aluno/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutName: newName, exercises: newExercises }),
      });
      if (res.ok) {
        toast.success('Treino pessoal criado!');
        setShowCreate(false);
        setNewName('');
        setNewExercises([{ exerciseName: '', sets: 3, reps: '12', restTime: '60s' }]);
        setTab('pessoal');
        // Refresh
        const dashRes = await fetch('/api/aluno/dashboard');
        if (dashRes.ok) {
          const d = await dashRes.json();
          setWorkouts(d?.workouts ?? []);
        }
      } else {
        const data = await res.json();
        toast.error(data?.error ?? 'Erro ao criar treino.');
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
          <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] space-y-4">
            <h2 className="font-display text-lg font-semibold">Novo Treino Pessoal</h2>
            <div className="space-y-2">
              <Label>Nome do Treino</Label>
              <Input placeholder="Ex: Treino de Pernas" value={newName}
                onChange={(e: any) => setNewName(e.target.value)} className="min-h-[44px]" />
            </div>
            <div className="space-y-3">
              <Label>Exercícios</Label>
              {newExercises.map((ex, i) => (
                <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary w-5">{i + 1}</span>
                    <Input placeholder="Nome do exercício" value={ex.exerciseName}
                      onChange={(e: any) => updateExercise(i, 'exerciseName', e.target.value)}
                      className="flex-1 min-h-[40px]" />
                    {newExercises.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeExercise(i)} className="text-destructive min-h-[36px]">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pl-7">
                    <div>
                      <Label className="text-[10px]">Séries</Label>
                      <Input type="number" value={ex.sets} min={1}
                        onChange={(e: any) => updateExercise(i, 'sets', parseInt(e.target.value) || 1)}
                        className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Repetições</Label>
                      <Input value={ex.reps}
                        onChange={(e: any) => updateExercise(i, 'reps', e.target.value)}
                        className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Descanso</Label>
                      <Input value={ex.restTime}
                        onChange={(e: any) => updateExercise(i, 'restTime', e.target.value)}
                        className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addExercise} className="gap-1 min-h-[36px]">
                <Plus className="h-3 w-3" /> Adicionar Exercício
              </Button>
            </div>
            <Button onClick={createWorkout} disabled={creating} className="w-full min-h-[44px]">
              {creating ? 'Criando...' : 'Criar Treino Pessoal'}
            </Button>
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
