'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LayoutDashboard, ClipboardList, History, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Dumbbell, Trophy, FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Avaliacoes', href: '/aluno/avaliacoes', icon: FileCheck },
  { label: 'Calendario', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Historico', href: '/aluno/historico', icon: History },
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface WorkoutLogEntry {
  id: string;
  completedAt: string;
  assignedWorkout: { workoutName: string };
  exerciseLogs: any[];
}

export function WorkoutCalendar() {
  const [logs, setLogs] = useState<WorkoutLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const { year, month } = currentMonth;
    const fromStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const toStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setLoading(true);
    fetch(`/api/aluno/history?from=${fromStr}&to=${toStr}`)
      .then((r: any) => r.ok ? r.json() : null)
      .then((d: any) => setLogs(d?.logs ?? []))
      .catch(() => toast.error('Erro ao carregar calendario.'))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const logsByDate = useMemo(() => {
    const map: Record<string, WorkoutLogEntry[]> = {};
    for (const log of logs) {
      const d = new Date(log.completedAt);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(log);
    }
    return map;
  }, [logs]);

  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { day: number; isCurrentMonth: boolean; dateKey: string }[] = [];

    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startPad - 1; i >= 0; i--) {
      const d = prevLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({
        day: d, isCurrentMonth: false,
        dateKey: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    for (let d = 1; d <= totalDays; d++) {
      days.push({
        day: d, isCurrentMonth: true,
        dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({
        day: d, isCurrentMonth: false,
        dateKey: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    return days;
  }, [currentMonth]);

  const prevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
    setSelectedDate(null);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  };

  const nowLocal = new Date();
  const todayKey = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
  const selectedLogs = selectedDate ? (logsByDate[selectedDate] ?? []) : [];

  const totalThisMonth = logs.length;
  const uniqueDays = Object.keys(logsByDate).length;
  const { year, month } = currentMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <DashboardShell navItems={navItems}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-[#10B981]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Calendario de Treinos</h1>
            <p className="text-muted-foreground text-sm">Acompanhe seus treinos dia a dia</p>
          </div>
        </div>

        {/* Monthly stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Treinos no mes</p>
            <p className="font-display text-2xl font-bold text-[#10B981] mt-1">{totalThisMonth}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Dias ativos</p>
            <p className="font-display text-2xl font-bold text-emerald-400 mt-1">{uniqueDays}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Frequencia</p>
            <p className="font-display text-2xl font-bold text-blue-400 mt-1">
              {daysInMonth > 0 ? Math.round((uniqueDays / daysInMonth) * 100) : 0}%
            </p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Media semanal</p>
            <p className="font-display text-2xl font-bold text-foreground mt-1">
              {daysInMonth > 0 ? (totalThisMonth / Math.ceil(daysInMonth / 7)).toFixed(1) : 0}
            </p>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <Button variant="ghost" size="sm" onClick={prevMonth} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h2 className="font-display font-semibold text-foreground">
                {MONTHS[currentMonth.month]} {currentMonth.year}
              </h2>
              <button onClick={goToToday} className="text-xs text-[#10B981] hover:text-[#34D399] mt-0.5 transition-colors">
                Hoje
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={nextMonth} className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border/30">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const workoutsOnDay = logsByDate[day.dateKey] ?? [];
              const hasWorkout = workoutsOnDay.length > 0;
              const isToday = day.dateKey === todayKey;
              const isSelected = day.dateKey === selectedDate;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(isSelected ? null : day.dateKey)}
                  className={cn(
                    'relative min-h-[56px] sm:min-h-[72px] p-1.5 border-b border-r border-border/20 transition-all text-left group',
                    !day.isCurrentMonth ? 'text-muted-foreground/20 bg-muted/10' : 'hover:bg-[rgba(255,255,255,0.02)]',
                    isSelected ? 'bg-[rgba(16,185,129,0.08)] ring-1 ring-[rgba(16,185,129,0.3)]' : '',
                  )}
                >
                  <span className={cn(
                    'inline-flex items-center justify-center text-xs font-medium w-7 h-7 rounded-full',
                    isToday ? 'bg-[#10B981] text-white font-bold' : 'text-foreground'
                  )}>
                    {day.day}
                  </span>
                  {hasWorkout && (
                    <div className="mt-0.5 flex flex-wrap gap-0.5 px-0.5">
                      {workoutsOnDay.slice(0, 3).map((_, wi) => (
                        <span key={wi} className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
                      ))}
                      {workoutsOnDay.length > 3 && (
                        <span className="text-[8px] text-emerald-400 font-bold ml-0.5">+{workoutsOnDay.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date details */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-5 border border-border/50 space-y-4"
          >
            <h3 className="font-display font-semibold flex items-center gap-2.5 text-foreground">
              <CalendarIcon className="h-4 w-4 text-[#10B981]" />
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </h3>
            {selectedLogs.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhum treino registrado neste dia.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedLogs.map((log) => (
                  <div key={log.id} className="bg-muted/20 rounded-xl p-4 space-y-2 border border-border/20">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm flex items-center gap-2 text-foreground">
                        <Trophy className="h-4 w-4 text-emerald-500" />
                        {log.assignedWorkout?.workoutName ?? 'Treino'}
                      </p>
                      <span className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        {new Date(log.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(log.exerciseLogs ?? []).map((el: any, ei: number) => (
                        <Badge key={ei} variant="outline" className="text-[10px] py-0.5 border-border/30 bg-card">
                          <Dumbbell className="h-2.5 w-2.5 mr-1 text-[#10B981]" />
                          {el.exerciseName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        )}
      </motion.div>
    </DashboardShell>
  );
}
