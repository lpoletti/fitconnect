'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Dumbbell, GraduationCap, Link2 } from 'lucide-react';

export default function OnboardingPage() {
  const { data: session, update } = useSession() || {};
  const router = useRouter();
  const [userType, setUserType] = useState<'professor' | 'aluno' | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!userType) {
      toast.error('Selecione seu perfil.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType, inviteCode: userType === 'aluno' ? inviteCode : undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? 'Erro ao configurar perfil');
      }
      // Trigger session update to refresh JWT with new userType
      await update();
      toast.success('Perfil configurado com sucesso!');
      if (userType === 'professor') {
        router.replace('/professor/dashboard');
      } else {
        router.replace('/aluno/dashboard');
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao configurar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display">Bem-vindo ao FitConnect!</h1>
          <p className="text-muted-foreground mt-1">Como você vai usar a plataforma?</p>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setUserType('professor')}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              userType === 'professor'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              userType === 'professor' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Sou Professor</p>
              <p className="text-sm text-muted-foreground">Quero criar treinos e gerenciar alunos</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setUserType('aluno')}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              userType === 'aluno'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              userType === 'aluno' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Sou Aluno</p>
              <p className="text-sm text-muted-foreground">Quero acompanhar meus treinos</p>
            </div>
          </button>
        </div>

        {userType === 'aluno' && (
          <div className="space-y-2">
            <Label className="text-sm">Código do Professor (opcional)</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={inviteCode}
                onChange={(e: any) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC123"
                maxLength={6}
                className="pl-9 uppercase"
              />
            </div>
            <p className="text-xs text-muted-foreground">Se seu professor te enviou um código, insira aqui para vincular automaticamente.</p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!userType || loading}
          className="w-full min-h-[44px]"
        >
          {loading ? 'Configurando...' : 'Continuar'}
        </Button>
      </div>
    </div>
  );
}
