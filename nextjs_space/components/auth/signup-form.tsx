'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Dumbbell, Mail, Lock, Eye, EyeOff, User, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function SignupForm() {
  const [userType, setUserType] = useState<'professor' | 'aluno'>('professor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const dest = session.user.userType === 'professor' ? '/professor/dashboard' : '/aluno/dashboard';
      router.replace(dest);
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, userType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Erro ao criar conta.');
        return;
      }
      toast.success('Conta criada! Entrando...');
      await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });
    } catch {
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="font-display text-2xl font-bold">FitConnect</span>
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight">Crie sua conta</h1>
          <p className="text-muted-foreground text-sm mt-1">Escolha seu perfil e comece agora.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] space-y-4">
          {/* User Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <button type="button"
              onClick={() => setUserType('professor')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all',
                userType === 'professor' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}>
              <GraduationCap className="h-4 w-4" /> Professor
            </button>
            <button type="button"
              onClick={() => setUserType('aluno')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all',
                userType === 'aluno' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}>
              <User className="h-4 w-4" /> Aluno
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="name" placeholder="Seu nome" value={name} onChange={(e: any) => setName(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e: any) => setEmail(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password} onChange={(e: any) => setPassword(e.target.value)} className="pl-10 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Repita a senha" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando conta...' : `Cadastrar como ${userType === 'professor' ? 'Professor' : 'Aluno'}`}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">Faça login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
