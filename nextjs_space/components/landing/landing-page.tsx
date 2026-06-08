'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Dumbbell, Users, ClipboardList, TrendingUp, ChevronRight,
  Smartphone, BarChart3, Shield, Zap, UserPlus, ListChecks, Activity,
  Crown, Star, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Grátis',
      monthly: 'R$ 0',
      annual: 'R$ 0',
      period: billing === 'monthly' ? '/mês' : '/mês',
      desc: 'Ideal para começar',
      icon: Zap,
      features: ['Até 2 alunos ativos', 'Repositório de treinos', 'Histórico de treinos', 'Acompanhamento de cargas'],
      highlight: false,
      cta: 'Começar Grátis',
    },
    {
      name: 'Pro 10',
      monthly: 'R$ 39,90',
      annual: 'R$ 29,90',
      desc: 'Para profissionais em crescimento',
      icon: Star,
      features: ['Até 10 alunos ativos', 'Tudo do plano Grátis', 'Upload de fotos/vídeos', 'Suporte prioritário'],
      highlight: false,
      cta: 'Assinar Pro 10',
    },
    {
      name: 'Pro 50',
      monthly: 'R$ 59,90',
      annual: 'R$ 49,90',
      desc: 'O mais popular',
      icon: Crown,
      features: ['Até 50 alunos ativos', 'Tudo do Pro 10', 'Relatórios avançados', 'Prioridade em novidades'],
      highlight: true,
      cta: 'Assinar Pro 50',
    },
    {
      name: 'Pro 100',
      monthly: 'R$ 89,90',
      annual: 'R$ 79,90',
      desc: 'Para grandes equipes',
      icon: Crown,
      features: ['Até 100 alunos ativos', 'Tudo do Pro 50', 'Múltiplos professores', 'API de integração'],
      highlight: false,
      cta: 'Assinar Pro 100',
    },
  ];

  return (
    <section className="py-20">
      <motion.div
        className="max-w-[1200px] mx-auto px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={stagger}
      >
        <motion.div variants={fadeUp} className="text-center mb-8">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Planos</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-2">Preços simples e acessíveis</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Alunos usam grátis, sempre. Professores começam grátis e escalam conforme crescem.</p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-10">
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
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">
              Economize até 25%
            </span>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan: any, i: number) => {
            const price = billing === 'monthly' ? plan.monthly : plan.annual;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`rounded-xl p-6 flex flex-col ${
                  plan.highlight
                    ? 'bg-primary text-primary-foreground shadow-[var(--shadow-lg)] ring-2 ring-primary scale-[1.02]'
                    : 'bg-card shadow-[var(--shadow-md)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <plan.icon className={`h-5 w-5 ${plan.highlight ? 'text-primary-foreground' : 'text-primary'}`} />
                  <span className="font-display font-semibold text-lg">{plan.name}</span>
                </div>
                <div className="mb-1">
                  <span className="font-display text-3xl font-bold">{price}</span>
                  <span className={`text-sm ${plan.highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {price !== 'R$ 0' ? (billing === 'monthly' ? '/mês' : '/mês (cobrado anualmente)') : '/mês'}
                  </span>
                </div>
                {billing === 'annual' && plan.monthly !== plan.annual && plan.monthly !== 'R$ 0' && (
                  <p className={`text-xs line-through mb-1 ${plan.highlight ? 'text-primary-foreground/50' : 'text-muted-foreground/60'}`}>
                    {plan.monthly}/mês no plano mensal
                  </p>
                )}
                <p className={`text-sm mb-5 ${plan.highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{plan.desc}</p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f: string, fi: number) => (
                    <li key={fi} className="flex items-start gap-2 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-primary-foreground' : 'text-primary'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button
                    className="w-full"
                    variant={plan.highlight ? 'secondary' : 'default'}
                    size="sm"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
        <motion.p variants={fadeUp} className="text-center text-muted-foreground text-sm mt-8">
          💡 Alunos utilizam a plataforma gratuitamente, sempre. Os planos acima são exclusivos para Professores.
        </motion.p>
      </motion.div>
    </section>
  );
}

export function LandingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const dest = session.user.userType === 'professor' ? '/professor/dashboard' : '/aluno/dashboard';
      router.replace(dest);
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Dumbbell className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold tracking-tight">FitConnect</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gap-1">
                Começar Grátis <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <motion.div
          className="max-w-[1200px] mx-auto px-4 py-20 md:py-32 text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" /> Plataforma gratuita para começar
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Conecte-se ao seu <span className="text-primary">treino ideal</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mt-6">
            A plataforma que une Personal Trainers e Alunos para criar, gerenciar e acompanhar treinos de forma simples e eficiente.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/signup">
              <Button size="lg" className="text-base px-8 gap-2">
                <UserPlus className="h-5 w-5" /> Criar Conta Grátis
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8">
                Já tenho conta
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Para Professores */}
      <section className="py-20 bg-muted/30">
        <motion.div
          className="max-w-[1200px] mx-auto px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Para Professores</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-2">Gerencie seus alunos com facilidade</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Crie treinos personalizados, acompanhe o progresso e mantenha seus alunos motivados.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: ClipboardList, title: 'Repositório de Treinos', desc: 'Crie e organize treinos em um repositório pessoal. Duplique e personalize com facilidade.' },
              { icon: Users, title: 'Gestão de Alunos', desc: 'Cadastre alunos por email, gerencie vínculos e acompanhe cada progresso individual.' },
              { icon: BarChart3, title: 'Acompanhe Resultados', desc: 'Visualize o histórico de treinos e a evolução de cargas de cada aluno.' },
            ].map((item: any, i: number) => (
              <motion.div key={i} variants={fadeUp} className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <p className="text-muted-foreground text-sm mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Para Alunos */}
      <section className="py-20">
        <motion.div
          className="max-w-[1200px] mx-auto px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">Para Alunos</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-2">Seu treino na palma da mão</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Acesse seus treinos, registre seu progresso e veja sua evolução ao longo do tempo.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, title: 'Treinos Acessíveis', desc: 'Acesse seus treinos de qualquer dispositivo, a qualquer momento.' },
              { icon: ListChecks, title: 'Execute e Registre', desc: 'Marque séries concluídas, registre cargas e repetições realizadas.' },
              { icon: Activity, title: 'Acompanhe sua Evolução', desc: 'Veja seu histórico completo e a progressão de cargas por exercício.' },
            ].map((item: any, i: number) => (
              <motion.div key={i} variants={fadeUp} className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <p className="text-muted-foreground text-sm mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 bg-muted/30">
        <motion.div
          className="max-w-[1200px] mx-auto px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Como Funciona</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Comece em 3 passos simples</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Crie sua Conta', desc: 'Cadastre-se como Professor ou Aluno em menos de 1 minuto.' },
              { step: '02', title: 'Conecte-se', desc: 'Professores cadastram alunos por email. Alunos se vinculam ao criar sua conta.' },
              { step: '03', title: 'Treine!', desc: 'Professores montam treinos, alunos executam e registram seu progresso.' },
            ].map((item: any, i: number) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-display text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <p className="text-muted-foreground text-sm mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Planos e Preços */}
      <PricingSection />

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <motion.div
          className="max-w-[1200px] mx-auto px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-10 md:p-16 text-center text-primary-foreground">
            <Shield className="h-10 w-10 mx-auto mb-4 opacity-80" />
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Comece agora, é grátis!</h2>
            <p className="mt-3 text-primary-foreground/80 max-w-lg mx-auto">
              Professores podem gerenciar até 2 alunos gratuitamente. Sem cartão de crédito.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="mt-8 text-base px-8 gap-2">
                Criar Minha Conta <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">FitConnect</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 FitConnect. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
            <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
