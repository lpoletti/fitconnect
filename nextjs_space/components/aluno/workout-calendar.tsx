'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LayoutDashboard, ClipboardList, History, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Dumbbell, Trophy, Flame
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Calendário', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Histórico', href: '/aluno/historico', icon: History },
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
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
    // Use YYYY-MM-DD strings to avoid timezone offset issues
    const fromStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const toStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setLoading(true);
    fetch(`/api/aluno/history?from=${fromStr}&to=${toStr}`)
      .then((r: any) => r.ok ? r.json() : null)
      .then((d: any) => setLogs(d?.logs ?? []))
      .catch(() => toast.error('Erro ao carregar calendário.'))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const logsByDate = useMemo(() => {
    const map: Record<string, WorkoutLogEntry[]> = {};
    for (const log of logs) {
      // Use local date to group (avoids UTC offset shifting the day)
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

    // Previous month padding
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startPad - 1; i >= 0; i--) {
      const d = prevLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({
        day: d,
        isCurrentMonth: false,
        dateKey: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        day: d,
        isCurrentMonth: true,
        dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({
        day: d,
        isCurrentMonth: false,
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

  // Monthly stats
  const totalThisMonth = logs.length;
  const uniqueDays = Object.keys(logsByDate).length;
  const { year, month } = currentMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" /> Calendário de Treinos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe seus treinos dia a dia</p>
        </div>

        {/* Monthly stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-sm)]">
            <p className="text-xs text-muted-foreground">Treinos no mês</p>
            <p className="text-2xl font-bold text-primary">{totalThisMonth}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-sm)]">
            <p className="text-xs text-muted-foreground">Dias ativos</p>
            <p className="text-2xl font-bold text-emerald-600">{uniqueDays}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-sm)] col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Frequência</p>
            <p className="text-2xl font-bold text-blue-600">{daysInMonth > 0 ? Math.round((uniqueDays / daysInMonth) * 100) : 0}%</p>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-card rounded-xl shadow-[var(--shadow-md)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h2 className="font-display font-semibold">
                {MONTHS[currentMonth.month]} {currentMonth.year}
              </h2>
              <Button variant="link" size="sm" onClick={goToToday} className="text-xs h-auto p-0 text-primary">
                Hoje
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center py-2 text-xs font-medium text-muted-foreground">
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
                  className={`relative min-h-[52px] sm:min-h-[64px] p-1 border-b border-r border-border/50 transition-colors text-left
                    ${!day.isCurrentMonth ? 'text-muted-foreground/40 bg-muted/20' : 'hover:bg-muted/50'}
                    ${isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : ''}
                    ${isToday && !isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
                  `}
                >
                  <span className={`text-xs font-medium ${isToday ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                    {day.day}
                  </span>
                  {hasWorkout && (
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      {workoutsOnDay.slice(0, 3).map((_, wi) => (
                        <span key={wi} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      ))}
                      {workoutsOnDay.length > 3 && (
                        <span className="text-[8px] text-emerald-600 font-bold">+{workoutsOnDay.length - 3}</span>
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
          <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] space-y-3">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </h3>
            {selectedLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum treino registrado neste dia.</p>
            ) : (
              <div className="space-y-2">
                {selectedLogs.map((log) => (
                  <div key={log.id} className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                        {log.assignedWorkout?.workoutName ?? 'Treino'}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(log.exerciseLogs ?? []).map((el: any, ei: number) => (
                        <Badge key={ei} variant="secondary" className="text-[10px] py-0">
                          <Dumbbell className="h-2.5 w-2.5 mr-1" />
                          {el.exerciseName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-4 text-muted-foreground text-sm">Carregando...</div>
        )}
      </div>
    </DashboardShell>
  );
}
