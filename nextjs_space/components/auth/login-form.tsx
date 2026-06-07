'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Dumbbell, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (!email || !password) {
      toast.error('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error('Email ou senha incorretos.');
      } else {
        toast.success('Login realizado!');
        // Session will update and useEffect redirect
      }
    } catch {
      toast.error('Erro ao realizar login.');
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
          <h1 className="font-display text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
          <p className="text-muted-foreground text-sm mt-1">Entre com suas credenciais para acessar sua conta.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email" type="email" placeholder="seu@email.com"
                value={email} onChange={(e: any) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password" type={showPassword ? 'text' : 'password'} placeholder="Sua senha"
                value={password} onChange={(e: any) => setPassword(e.target.value)}
                className="pl-10 pr-10"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">Cadastre-se</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
