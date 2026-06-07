'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: 'default' | 'warning' | 'success';
}

export function StatCard({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) {
  const colors = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-amber-500/10 text-amber-500',
    success: 'bg-emerald-500/10 text-emerald-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="font-display text-2xl font-bold mt-1">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg ${colors[variant] ?? colors.default} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
