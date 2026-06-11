'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  LayoutDashboard, ClipboardList, History, Trophy,
  Calendar as CalendarIcon, Filter, FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutHistoryCard } from '@/components/fitness/workout-history-card';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Avaliacoes', href: '/aluno/avaliacoes', icon: FileCheck },
  { label: 'Calendario', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Historico', href: '/aluno/historico', icon: History },
];

export function AlunoHistorico() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchHistory = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/aluno/history?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } catch {
      toast.error('Erro ao carregar historico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleFilter = () => {
    fetchHistory(fromDate, toDate);
  };

  const logs = data?.logs ?? [];
  const stats = data?.stats ?? {};

  return (
    <DashboardShell navItems={navItems}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">Historico de Treinos</h1>
            <p className="text-muted-foreground text-sm">Acompanhe todos os treinos executados.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Total Concluidos" value={stats?.totalCompleted ?? 0} icon={Trophy} variant="success" />
          <StatCard title="Esta Semana" value={stats?.thisWeek ?? 0} icon={CalendarIcon} />
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs text-muted-foreground">De</Label>
              <Input type="date" value={fromDate} onChange={(e: any) => setFromDate(e.target.value)}
                className="h-10 bg-secondary/30 border-border/30 rounded-xl" />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs text-muted-foreground">Ate</Label>
              <Input type="date" value={toDate} onChange={(e: any) => setToDate(e.target.value)}
                className="h-10 bg-secondary/30 border-border/30 rounded-xl" />
            </div>
            <Button size="sm" onClick={handleFilter} className="gap-1.5 min-h-[40px] rounded-xl">
              <Filter className="h-4 w-4" /> Filtrar
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 border border-border/50 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <History className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">Nenhum treino concluido encontrado.</p>
            </div>
          ) : (
            logs.map((log: any, idx: number) => {
              const isExpanded = expandedLog === log?.id;
              const volume = log?.exerciseLogs?.reduce((acc: number, el: any) => {
                return acc + (parseInt(el?.weightUsed) || 0) * (parseInt(el?.repsCompleted) || 0);
              }, 0);
              return (
                <motion.div
                  key={log?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <div className="cursor-pointer" onClick={() => setExpandedLog(isExpanded ? null : log?.id)}>
                    <WorkoutHistoryCard
                      date={log?.completedAt ? format(new Date(log.completedAt), "dd/MM/yyyy") : '-'}
                      name={log?.assignedWorkout?.workoutName ?? 'Treino'}
                      duration={log?.durationMinutes ?? 0}
                      volume={volume}
                      exercises={(log?.exerciseLogs ?? []).length}
                      improved={idx === 0}
                    />
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/30 p-4 space-y-2 bg-muted/10 rounded-b-2xl">
                          {(log?.exerciseLogs ?? []).map((el: any, i: number) => (
                            <div key={el?.id ?? i} className="flex items-center gap-3 text-sm bg-card/50 rounded-xl p-3 border border-border/20">
                              <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {i + 1}
                              </span>
                              <span className="flex-1 font-medium text-foreground">{el?.exerciseName ?? 'Exercicio'}</span>
                              <span className="text-muted-foreground bg-muted/30 px-2 py-0.5 rounded text-xs">
                                {el?.setsCompleted ?? 0}x{el?.repsCompleted ?? '-'}
                              </span>
                              {el?.weightUsed && (
                                <span className="text-muted-foreground bg-muted/30 px-2 py-0.5 rounded text-xs">
                                  {el.weightUsed}
                                </span>
                              )}
                            </div>
                          ))}
                          {log?.notes && (
                            <p className="text-xs text-muted-foreground italic mt-2 px-1">
                              Obs: {log.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
