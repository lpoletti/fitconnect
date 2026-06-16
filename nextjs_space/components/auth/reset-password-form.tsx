'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter no minimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas nao conferem.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao redefinir senha.');
        if (data.error?.includes('invalido') || data.error?.includes('expirado')) {
          setInvalidToken(true);
        }
        return;
      }
      setSuccess(true);
      toast.success('Senha redefinida com sucesso!');
    } catch {
      toast.error('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (invalidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Dumbbell className="h-8 w-8 text-primary" />
              <span className="font-display text-2xl font-bold">FitConnect</span>
            </Link>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="font-display text-xl font-bold">Link invalido</h1>
            <p className="text-muted-foreground text-sm">
              O link de recuperacao e invalido ou expirado. Solicite um novo link.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full mt-4">Solicitar novo link</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Dumbbell className="h-8 w-8 text-primary" />
              <span className="font-display text-2xl font-bold">FitConnect</span>
            </Link>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-primary mx-auto" />
            <h1 className="font-display text-xl font-bold">Senha redefinida!</h1>
            <p className="text-muted-foreground text-sm">
              Sua senha foi alterada com sucesso. Faca login com a nova senha.
            </p>
            <Link href="/login">
              <Button className="w-full mt-4">Ir para o login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="font-display text-2xl font-bold">FitConnect</span>
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight">Redefinir senha</h1>
          <p className="text-muted-foreground text-sm mt-1">Crie uma nova senha para sua conta.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password" type={showPassword ? 'text' : 'password'} placeholder="Minimo 6 caracteres"
                value={password} onChange={(e: any) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Repita a senha"
                value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </Button>
          <Link href="/login" className="block text-center">
            <Button type="button" variant="ghost" className="w-full gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Button>
          </Link>
        </form>
      </div>
    </div>
  );
}
