'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { MediaGallery } from '@/components/shared/media-lightbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LayoutDashboard, Users, ClipboardList, ArrowLeft, Edit,
  Dumbbell, Tag, Clock, Weight, Flame
, CreditCard
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/professor/alunos', icon: Users },
  { label: 'Treinos', href: '/professor/treinos', icon: ClipboardList },
  { label: 'Meu Plano', href: '/professor/plano', icon: CreditCard },
];

function getSetsDisplay(ex: any): { reps: string; weight: string; restTime: string }[] {
  if (ex?.setsConfig && Array.isArray(ex.setsConfig) && ex.setsConfig.length > 0) {
    return ex.setsConfig;
  }
  return Array.from({ length: ex?.sets ?? 3 }, () => ({
    reps: ex?.reps ?? '12',
    weight: ex?.suggestedWeight ?? '',
    restTime: ex?.restTime ?? '',
  }));
}

function getWarmupDisplay(ex: any): { reps: string; weight: string; weightUnit: string; restTime: string }[] {
  if (ex?.warmupConfig && Array.isArray(ex.warmupConfig) && ex.warmupConfig.length > 0) {
    return ex.warmupConfig;
  }
  return [];
}

export function TreinoDetail({ id }: { id: string }) {
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/professor/workouts/${id}`)
      .then((r: any) => r.ok ? r.json() : null)
      .then((d: any) => setWorkout(d))
      .catch(() => toast.error('Erro ao carregar treino.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/professor/treinos">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold tracking-tight">{workout?.name ?? 'Carregando...'}</h1>
            {workout?.category && (
              <Badge variant="secondary" className="mt-1 gap-1"><Tag className="h-3 w-3" /> {workout.category}</Badge>
            )}
          </div>
          {workout && (
            <Link href={`/professor/treinos/${id}/editar`}>
              <Button size="sm" className="gap-1"><Edit className="h-4 w-4" /> Editar</Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : !workout ? (
          <div className="text-center py-12 text-muted-foreground">Treino não encontrado.</div>
        ) : (
          <>
            {workout?.description && (
              <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)]">
                <p className="text-muted-foreground">{workout.description}</p>
              </div>
            )}
            <div className="bg-card rounded-xl shadow-[var(--shadow-md)]">
              <div className="p-4 border-b border-border">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" /> Exercícios ({(workout?.exercises ?? []).length})
                </h2>
              </div>
              <div className="divide-y divide-border">
                {(workout?.exercises ?? []).map((ex: any, i: number) => {
                  const sets = getSetsDisplay(ex);
                  const warmups = ex?.hasWarmup ? getWarmupDisplay(ex) : [];
                  return (
                    <div key={ex?.id ?? i} className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{i + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium">{ex?.exerciseName ?? 'Exercício'}</p>
                          {ex?.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{ex.notes}</p>}
                        </div>
                        <MediaGallery
                          files={
                            ex?.mediaFiles && Array.isArray(ex.mediaFiles) && ex.mediaFiles.length > 0
                              ? ex.mediaFiles
                              : ex?.mediaUrl ? [{ url: ex.mediaUrl, type: ex.mediaType }] : []
                          }
                        />
                      </div>

                      {/* Warmup sets */}
                      {warmups.length > 0 && (
                        <div className="ml-11 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30 rounded-lg p-3 space-y-1.5">
                          <p className="text-xs font-medium text-orange-700 dark:text-orange-400 flex items-center gap-1">
                            <Flame className="h-3 w-3" /> Aquecimento
                          </p>
                          {warmups.map((ws: any, wi: number) => (
                            <div key={wi} className="flex flex-wrap gap-3 text-xs text-orange-600 dark:text-orange-400 items-center">
                              <span className="w-4 h-4 rounded bg-orange-200/50 dark:bg-orange-800/30 flex items-center justify-center text-[10px] font-bold">{wi + 1}</span>
                              <span>{ws.reps} reps</span>
                              {ws.weight && (
                                <span className="flex items-center gap-1">
                                  <Weight className="h-3 w-3" />
                                  {ws.weight}{ws.weightUnit === 'percent' ? '% da carga' : 'kg'}
                                </span>
                              )}
                              {ws.restTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />{ws.restTime}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Work sets */}
                      <div className="ml-11 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Séries de trabalho</p>
                        {sets.map((s: any, si: number) => (
                          <div key={si} className="flex flex-wrap gap-3 text-xs text-muted-foreground items-center">
                            <span className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{si + 1}</span>
                            <span>{s.reps} reps</span>
                            {s.weight && <span className="flex items-center gap-1"><Weight className="h-3 w-3" />{s.weight}</span>}
                            {s.restTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.restTime}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
