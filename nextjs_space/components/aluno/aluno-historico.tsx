'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  LayoutDashboard, ClipboardList, History, Trophy,
  Calendar as CalendarIcon, CheckCircle, ChevronDown, ChevronUp, Filter
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Calendário', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Histórico', href: '/aluno/historico', icon: History },
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
      toast.error('Erro ao carregar histórico.');
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
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Histórico de Treinos</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe todos os treinos executados.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Total Concluídos" value={stats?.totalCompleted ?? 0} icon={Trophy} variant="success" />
          <StatCard title="Esta Semana" value={stats?.thisWeek ?? 0} icon={CalendarIcon} />
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-md)]">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">De</Label>
              <Input type="date" value={fromDate} onChange={(e: any) => setFromDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Até</Label>
              <Input type="date" value={toDate} onChange={(e: any) => setToDate(e.target.value)} className="h-9" />
            </div>
            <Button size="sm" onClick={handleFilter} className="gap-1">
              <Filter className="h-4 w-4" /> Filtrar
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="bg-card rounded-xl p-12 shadow-[var(--shadow-md)] text-center">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum treino concluído encontrado.</p>
            </div>
          ) : (
            logs.map((log: any) => (
              <div key={log?.id} className="bg-card rounded-xl shadow-[var(--shadow-md)] overflow-hidden">
                <button
                  onClick={() => setExpandedLog(expandedLog === log?.id ? null : log?.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{log?.assignedWorkout?.workoutName ?? 'Treino'}</p>
                    <p className="text-xs text-muted-foreground">
                      {log?.completedAt ? format(new Date(log.completedAt), "dd/MM/yyyy 'às' HH:mm") : '-'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{(log?.exerciseLogs ?? []).length} exercícios</span>
                  {expandedLog === log?.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedLog === log?.id && (
                  <div className="border-t border-border p-4 space-y-2 bg-muted/20">
                    {(log?.exerciseLogs ?? []).map((el: any, i: number) => (
                      <div key={el?.id ?? i} className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                        <span className="flex-1 font-medium">{el?.exerciseName ?? 'Exercício'}</span>
                        <span className="text-muted-foreground">{el?.setsCompleted ?? 0}x{el?.repsCompleted ?? '-'}</span>
                        {el?.weightUsed && <span className="text-muted-foreground">{el.weightUsed}</span>}
                      </div>
                    ))}
                    {log?.notes && (
                      <p className="text-xs text-muted-foreground italic mt-2">Obs: {log.notes}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
