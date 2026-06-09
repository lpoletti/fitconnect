'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, ClipboardList, History, Calendar as CalendarIcon,
  ClipboardCheck, ChevronDown, ChevronUp, Ruler, Camera, Target, FileCheck,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Avaliações', href: '/aluno/avaliacoes', icon: FileCheck },
  { label: 'Calendário', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Histórico', href: '/aluno/historico', icon: History },
];

export function AlunoAvaliacoes() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEval, setExpandedEval] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/aluno/evaluations')
      .then(res => res.ok ? res.json() : [])
      .then(data => setEvaluations(data ?? []))
      .catch(() => setEvaluations([]))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
  };

  const daysMap: Record<string, string> = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };

  return (
    <DashboardShell navItems={navItems}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-primary" /> Minhas Avaliações
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe suas avaliações físicas realizadas pelo professor.</p>
        </div>

        <div className="bg-card rounded-xl shadow-[var(--shadow-md)]">
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : evaluations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma avaliação registrada.</p>
                <p className="text-xs mt-1">Seu professor fará sua avaliação em breve.</p>
              </div>
            ) : (
              evaluations.map((ev: any) => {
                const days: string[] = Array.isArray(ev.trainingDays) ? ev.trainingDays : [];
                return (
                  <div key={ev.id} className="hover:bg-muted/50 transition-colors">
                    <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedEval(expandedEval === ev.id ? null : ev.id)}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{formatDate(ev.createdAt)}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {ev.professor?.user?.name && <span>Prof. {ev.professor.user.name}</span>}
                          {ev.weight && <span>• {ev.weight}kg</span>}
                          {ev.height && <span>• {ev.height}cm</span>}
                          {ev.mainGoal && <span>• {ev.mainGoal}</span>}
                        </div>
                      </div>
                      {expandedEval === ev.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>

                    {expandedEval === ev.id && (
                      <div className="px-4 pb-4 space-y-4">
                        {/* Dados Pessoais */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <h3 className="font-semibold text-sm flex items-center gap-2"><Ruler className="h-4 w-4" /> Dados Pessoais + Anamnese</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                            <div><span className="text-muted-foreground">Nome:</span> {ev.name}</div>
                            {ev.birthDate && <div><span className="text-muted-foreground">Nascimento:</span> {formatDate(ev.birthDate)}</div>}
                            {ev.sex && <div><span className="text-muted-foreground">Sexo:</span> {ev.sex}</div>}
                            {ev.phone && <div><span className="text-muted-foreground">Telefone:</span> {ev.phone}</div>}
                            {ev.email && <div><span className="text-muted-foreground">Email:</span> {ev.email}</div>}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant={ev.previousTraining ? 'default' : 'secondary'}>{ev.previousTraining ? 'Já treinou' : 'Nunca treinou'}</Badge>
                            {ev.healthIssues && <Badge variant="destructive">Problemas de saúde</Badge>}
                            {ev.medication && <Badge variant="secondary">Toma medicamento</Badge>}
                            {ev.mainGoal && <Badge variant="outline">Meta: {ev.mainGoal}</Badge>}
                            {ev.sleepQuality && <Badge variant="outline">Sono: {ev.sleepQuality}</Badge>}
                            {ev.stressLevel && <Badge variant="outline">Estresse: {ev.stressLevel}</Badge>}
                          </div>
                          {ev.healthDetails && <p className="text-xs text-muted-foreground">Detalhes saúde: {ev.healthDetails}</p>}
                          {ev.medicationDetails && <p className="text-xs text-muted-foreground">Medicamentos: {ev.medicationDetails}</p>}
                        </div>

                        {/* Medidas + Fotos */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <h3 className="font-semibold text-sm flex items-center gap-2"><Camera className="h-4 w-4" /> Medidas + Fotos</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            {ev.weight && <div><span className="text-muted-foreground">Peso:</span> {ev.weight} kg</div>}
                            {ev.height && <div><span className="text-muted-foreground">Altura:</span> {ev.height} cm</div>}
                            {ev.waist && <div><span className="text-muted-foreground">Cintura:</span> {ev.waist} cm</div>}
                            {ev.abdomen && <div><span className="text-muted-foreground">Abdômen:</span> {ev.abdomen} cm</div>}
                            {ev.hip && <div><span className="text-muted-foreground">Quadril:</span> {ev.hip} cm</div>}
                            {ev.rightArm && <div><span className="text-muted-foreground">Braço D:</span> {ev.rightArm} cm</div>}
                            {ev.leftArm && <div><span className="text-muted-foreground">Braço E:</span> {ev.leftArm} cm</div>}
                            {ev.rightThigh && <div><span className="text-muted-foreground">Coxa D:</span> {ev.rightThigh} cm</div>}
                            {ev.leftThigh && <div><span className="text-muted-foreground">Coxa E:</span> {ev.leftThigh} cm</div>}
                          </div>
                          {(ev.photoFrontUrl || ev.photoBackUrl || ev.photoSideUrl) && (
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              {ev.photoFrontUrl && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground text-center">Frente</p>
                                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                                    <img src={ev.photoFrontUrl} alt="Frente" className="w-full h-full object-cover" />
                                  </div>
                                </div>
                              )}
                              {ev.photoBackUrl && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground text-center">Costas</p>
                                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                                    <img src={ev.photoBackUrl} alt="Costas" className="w-full h-full object-cover" />
                                  </div>
                                </div>
                              )}
                              {ev.photoSideUrl && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground text-center">Lateral</p>
                                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                                    <img src={ev.photoSideUrl} alt="Lateral" className="w-full h-full object-cover" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Objetivos + Termo */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <h3 className="font-semibold text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Objetivos + Termo</h3>
                          {ev.specificGoal && <p className="text-sm"><span className="text-muted-foreground">Objetivo específico:</span> {ev.specificGoal}</p>}
                          {days.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              <span className="text-sm text-muted-foreground">Dias:</span>
                              {days.map((d: string) => <Badge key={d} variant="outline" className="text-xs">{daysMap[d] ?? d}</Badge>)}
                            </div>
                          )}
                          {ev.studentNotes && <p className="text-sm"><span className="text-muted-foreground">Observações:</span> {ev.studentNotes}</p>}
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant={ev.agreedTerms ? 'default' : 'destructive'} className={ev.agreedTerms ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}>
                              {ev.agreedTerms ? 'Termo aceito' : 'Termo não aceito'}
                            </Badge>
                            {ev.signatureName && <span className="text-muted-foreground">Assinatura: {ev.signatureName}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
