'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: 'default' | 'warning' | 'success' | 'info';
  trend?: { value: string; positive: boolean };
}

export function StatCard({ title, value, icon: Icon, description, variant = 'default', trend }: StatCardProps) {
  const variants = {
    default: {
      iconBg: 'bg-[rgba(16,185,129,0.15)]',
      iconColor: 'text-[#10B981]',
      accent: 'bg-[#10B981]',
      ring: 'ring-[rgba(16,185,129,0.2)]',
    },
    success: {
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      accent: 'bg-emerald-500',
      ring: 'ring-emerald-500/20',
    },
    warning: {
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      accent: 'bg-amber-500',
      ring: 'ring-amber-500/20',
    },
    info: {
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      accent: 'bg-blue-500',
      ring: 'ring-blue-500/20',
    },
  };

  const v = variants[variant] ?? variants.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group relative bg-card rounded-2xl p-5 border border-border/50 overflow-hidden',
        'hover:border-border/80 hover:shadow-lg hover:shadow-black/20 transition-all duration-normal',
        'hover:-translate-y-0.5'
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[rgba(16,185,129,0.03)] pointer-events-none" />

      {/* Accent line */}
      <div className={cn('absolute top-0 left-0 right-0 h-0.5 opacity-60', v.accent)} />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="font-display text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', v.iconBg)}>
            <Icon className={cn('h-5 w-5', v.iconColor)} />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className={cn(
              'font-medium',
              trend.positive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trend.positive ? '+' : ''}{trend.value}
            </span>
            <span className="text-muted-foreground">vs. mes passado</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
