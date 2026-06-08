'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Mail, Lock, Eye, EyeOff, User, GraduationCap, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function SignupForm() {
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get('type');
  const emailParam = searchParams?.get('email');

  const [userType, setUserType] = useState<'professor' | 'aluno'>(
    typeParam === 'aluno' ? 'aluno' : 'professor'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState(emailParam ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
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
        body: JSON.stringify({ email, password, name, userType, inviteCode: inviteCode.trim() || undefined }),
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
                'flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all min-h-[44px]',
                userType === 'professor' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}>
              <GraduationCap className="h-4 w-4" /> Professor
            </button>
            <button type="button"
              onClick={() => setUserType('aluno')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all min-h-[44px]',
                userType === 'aluno' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}>
              <User className="h-4 w-4" /> Aluno
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="name" placeholder="Seu nome" value={name} onChange={(e: any) => setName(e.target.value)} className="pl-10 min-h-[44px]" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e: any) => setEmail(e.target.value)} className="pl-10 min-h-[44px]" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password} onChange={(e: any) => setPassword(e.target.value)} className="pl-10 pr-10 min-h-[44px]" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Repita a senha" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} className="pl-10 min-h-[44px]" />
            </div>
          </div>

          {/* Invite Code for Aluno */}
          {userType === 'aluno' && (
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Código do Professor (opcional)</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="inviteCode" placeholder="Ex: ABC123" value={inviteCode}
                  onChange={(e: any) => setInviteCode(e.target.value.toUpperCase())}
                  className="pl-10 min-h-[44px] font-mono tracking-wider" maxLength={6} />
              </div>
              <p className="text-xs text-muted-foreground">Se seu professor forneceu um código, insira aqui para vincular automaticamente.</p>
            </div>
          )}

          <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
            {loading ? 'Criando conta...' : `Cadastrar como ${userType === 'professor' ? 'Professor' : 'Aluno'}`}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full min-h-[44px] gap-2"
            onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Cadastrar com Google
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
