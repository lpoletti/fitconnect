'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dumbbell, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Informe seu email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao enviar email.');
        return;
      }
      setSent(true);
      toast.success('Email de recuperacao enviado!');
    } catch {
      toast.error('Erro ao enviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
            <h1 className="font-display text-xl font-bold">Email enviado!</h1>
            <p className="text-muted-foreground text-sm">
              Se <strong>{email}</strong> estiver cadastrado, voce recebera um link para redefinir sua senha.
            </p>
            <p className="text-muted-foreground text-xs">
              Nao esqueca de verificar a pasta de spam.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full mt-4 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </Button>
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
          <h1 className="font-display text-2xl font-bold tracking-tight">Esqueceu a senha?</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Informe seu email e enviaremos um link para redefinir sua senha.
          </p>
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
                autoFocus
              />
            </div>
          </div>
          <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link de recuperacao'}
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
