'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Dumbbell, Menu, X, LogOut, ChevronDown, LogOutIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

export function DashboardShell({ children, navItems }: { children: React.ReactNode; navItems: NavItem[] }) {
  const { data: session } = useSession() || {};
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userType = session?.user?.userType ?? 'professor';
  const userName = session?.user?.name ?? 'Usuario';
  const userInitial = userName?.charAt(0)?.toUpperCase() ?? 'U';
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const handleSignOut = () => signOut({ callbackUrl: '/' });

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 shrink-0">
        <Link
          href={userType === 'professor' ? '/professor/dashboard' : '/aluno/dashboard'}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-white">Fit</span>
            <span className="text-gradient">Connect</span>
          </span>
        </Link>
        <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSidebarOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {(navItems ?? []).map((item: NavItem) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-fast relative',
                active
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.04)]'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-[rgba(16,185,129,0.15)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {active && (
                <motion.div
                  layoutId="sidebar-border"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#10B981]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className={cn(
                'h-5 w-5 relative z-10',
                active ? 'text-[#10B981]' : ''
              )} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{userType === 'professor' ? 'Personal Trainer' : 'Aluno'}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1 justify-start gap-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9"
          onClick={handleSignOut}
        >
          <LogOutIcon className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar - always visible */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[280px] lg:fixed lg:inset-y-0 z-50 border-r border-border/50 bg-[#0F172A]">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar - slide in */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-72 z-50 bg-[#0F172A] border-r border-border/50 shadow-2xl lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="lg:pl-[280px] flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass-strong h-16 flex items-center gap-4 px-4 lg:px-8">
          <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Ola, <span className="text-foreground font-medium">{userName?.split(' ')?.[0] ?? 'Usuario'}</span>
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center text-white text-xs font-bold shadow-md">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 animate-fade-in">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
