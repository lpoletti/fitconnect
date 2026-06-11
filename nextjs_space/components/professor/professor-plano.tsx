'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, ClipboardList, Crown,
  Check, Zap, Star, CreditCard, ExternalLink, Loader2
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', href: '/professor/alunos', icon: Users },
  { label: 'Treinos', href: '/professor/treinos', icon: ClipboardList },
];

const PLANS = [
  {
    key: 'free',
    name: 'Grátis',
    monthly: 0,
    annual: 0,
    icon: Zap,
    maxStudents: 2,
    features: ['Até 2 alunos ativos', 'Repositório de treinos', 'Histórico de treinos', 'Acompanhamento de cargas'],
  },
  {
    key: 'pro10',
    name: 'Pro 10',
    monthly: 3990,
    annual: 2990,
    icon: Star,
    maxStudents: 10,
    features: ['Até 10 alunos ativos', 'Upload de fotos/vídeos', 'Suporte prioritário'],
  },
  {
    key: 'pro50',
    name: 'Pro 50',
    monthly: 5990,
    annual: 4990,
    icon: Crown,
    maxStudents: 50,
    features: ['Até 50 alunos ativos', 'Relatórios avançados', 'Prioridade em novidades'],
    highlight: true,
  },
  {
    key: 'pro100',
    name: 'Pro 100',
    monthly: 8990,
    annual: 7990,
    icon: Crown,
    maxStudents: 100,
    features: ['Até 100 alunos ativos', 'Múltiplos professores', 'API de integração'],
  },
];

function formatBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export function ProfessorPlano() {
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<any>(null);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    fetch('/api/professor/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      toast.success('Assinatura realizada com sucesso! Seu plano foi atualizado.');
    } else if (searchParams?.get('canceled') === 'true') {
      toast.info('Assinatura cancelada.');
    }
  }, [searchParams]);

  const handleSubscribe = async (planKey: string) => {
    setLoadingPlan(planKey);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey, billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Erro ao criar sessão de pagamento');
      }
    } catch {
      toast.error('Erro ao processar pagamento');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Erro ao abrir portal');
      }
    } catch {
      toast.error('Erro ao abrir portal de cobrança');
    } finally {
      setLoadingPortal(false);
    }
  };

  const currentPlan = stats?.plan ?? 'free';

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" /> Meu Plano
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie sua assinatura e limite de alunos</p>
        </div>

        {/* Current plan info */}
        <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Plano atual</p>
              <div className="font-display text-xl font-bold flex items-center gap-2">
                {stats?.planName ?? 'Grátis'}
                <Badge variant={currentPlan === 'free' ? 'secondary' : 'default'}>
                  {stats?.activeStudents ?? 0}/{stats?.maxStudents ?? 2} alunos
                </Badge>
              </div>
            </div>
            {currentPlan !== 'free' && (
              <Button variant="outline" size="sm" onClick={handlePortal} disabled={loadingPortal}>
                {loadingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-1" />}
                Gerenciar Assinatura
              </Button>
            )}
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3">
          <div className="inline-flex items-center p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billing === 'monthly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBilling('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billing === 'annual' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Anual
            </button>
          </div>
          {billing === 'annual' && (
            <span className="text-xs font-semibold text-primary bg-primary/5 dark:bg-primary/20 px-2.5 py-1 rounded-full">
              Economize até 25%
            </span>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const price = billing === 'monthly' ? plan.monthly : plan.annual;
            const isCurrent = plan.key === currentPlan;
            const isUpgrade = PLANS.findIndex(p => p.key === plan.key) > PLANS.findIndex(p => p.key === currentPlan);
            const isDowngrade = PLANS.findIndex(p => p.key === plan.key) < PLANS.findIndex(p => p.key === currentPlan);

            return (
              <div
                key={plan.key}
                className={`rounded-xl p-5 flex flex-col transition-all ${
                  isCurrent
                    ? 'bg-primary/5 border-2 border-primary'
                    : plan.highlight
                    ? 'bg-card shadow-[var(--shadow-lg)] ring-1 ring-primary/20'
                    : 'bg-card shadow-[var(--shadow-md)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <plan.icon className="h-5 w-5 text-primary" />
                  <span className="font-display font-semibold">{plan.name}</span>
                  {isCurrent && <Badge variant="default" className="text-[10px] ml-auto">Atual</Badge>}
                </div>
                <div className="mb-3">
                  <span className="font-display text-2xl font-bold">{price === 0 ? 'R$ 0' : formatBRL(price)}</span>
                  <span className="text-xs text-muted-foreground">
                    {price > 0 ? (billing === 'monthly' ? '/mês' : '/mês (anual)') : '/mês'}
                  </span>
                </div>
                <ul className="space-y-2 mb-4 flex-1">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button variant="outline" size="sm" disabled className="w-full">Plano Atual</Button>
                ) : plan.key === 'free' ? (
                  isDowngrade ? (
                    <Button variant="outline" size="sm" onClick={handlePortal} disabled={loadingPortal} className="w-full">
                      Gerenciar Assinatura
                    </Button>
                  ) : null
                ) : isUpgrade || isDowngrade ? (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleSubscribe(plan.key)}
                    disabled={loadingPlan === plan.key}
                  >
                    {loadingPlan === plan.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isUpgrade ? 'Fazer Upgrade' : 'Alterar Plano'}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
