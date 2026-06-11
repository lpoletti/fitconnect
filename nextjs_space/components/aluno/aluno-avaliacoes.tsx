'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard, ClipboardList, History, Calendar as CalendarIcon,
  ClipboardCheck, ChevronDown, ChevronUp, Ruler, Camera, Target, FileCheck,
  Weight, TrendingUp, Activity, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', href: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Meus Treinos', href: '/aluno/treinos', icon: ClipboardList },
  { label: 'Avaliacoes', href: '/aluno/avaliacoes', icon: FileCheck },
  { label: 'Calendario', href: '/aluno/calendario', icon: CalendarIcon },
  { label: 'Historico', href: '/aluno/historico', icon: History },
];

const daysMap: Record<string, string> = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sab', dom: 'Dom' };

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

  return (
    <DashboardShell navItems={navItems}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-[#10B981]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Minhas Avaliacoes</h1>
            <p className="text-muted-foreground text-sm">Acompanhe suas avaliacoes fisicas realizadas pelo professor.</p>
          </div>
        </div>

        {/* Stats summary */}
        {!loading && evaluations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-display text-2xl font-bold text-[#10B981]">{evaluations.length}</p>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">Peso Atual</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {evaluations[0]?.weight ?? '-'} <span className="text-sm text-muted-foreground">kg</span>
              </p>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">Meta Principal</p>
              <p className="font-display text-lg font-bold text-foreground truncate">
                {evaluations[0]?.mainGoal ?? '-'}
              </p>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">Ultima</p>
              <p className="font-display text-sm font-bold text-foreground">
                {formatDate(evaluations[0]?.createdAt) ?? '-'}
              </p>
            </div>
          </div>
        )}

        {/* Evaluation list */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-32 rounded-xl" />
                </div>
              ))}
            </div>
          ) : evaluations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">Nenhuma avaliacao registrada.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Seu professor fara sua avaliacao em breve.</p>
            </div>
          ) : (
            evaluations.map((ev: any) => {
              const days: string[] = Array.isArray(ev.trainingDays) ? ev.trainingDays : [];
              const isExpanded = expandedEval === ev.id;

              return (
                <div key={ev.id} className="transition-colors">
                  <button
                    className="w-full p-5 flex items-center gap-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors text-left"
                    onClick={() => setExpandedEval(isExpanded ? null : ev.id)}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[rgba(16,185,129,0.12)] flex items-center justify-center shrink-0">
                      <ClipboardCheck className="h-6 w-6 text-[#10B981]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{formatDate(ev.createdAt)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {ev.professor?.user?.name && <span>Prof. {ev.professor.user.name}</span>}
                        {ev.weight && <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />}
                        {ev.weight && <span>{ev.weight}kg</span>}
                        {ev.mainGoal && <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />}
                        {ev.mainGoal && <span>{ev.mainGoal}</span>}
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-6 space-y-5">
                          {/* Dados Pessoais + Anamnese */}
                          <div className="bg-muted/20 rounded-2xl p-5 border border-border/30 space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                              <User className="h-4 w-4 text-[#10B981]" /> Dados Pessoais + Anamnese
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                              {ev.name && <div><span className="text-muted-foreground text-xs">Nome:</span><p className="text-foreground">{ev.name}</p></div>}
                              {ev.birthDate && <div><span className="text-muted-foreground text-xs">Nascimento:</span><p className="text-foreground">{formatDate(ev.birthDate)}</p></div>}
                              {ev.sex && <div><span className="text-muted-foreground text-xs">Sexo:</span><p className="text-foreground">{ev.sex}</p></div>}
                              {ev.phone && <div><span className="text-muted-foreground text-xs">Telefone:</span><p className="text-foreground">{ev.phone}</p></div>}
                              {ev.email && <div><span className="text-muted-foreground text-xs">Email:</span><p className="text-foreground truncate">{ev.email}</p></div>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className={cn(
                                'text-xs border-border/50',
                                ev.previousTraining ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981]' : 'bg-muted/50 text-muted-foreground'
                              )}>
                                {ev.previousTraining ? 'Ja treinou' : 'Nunca treinou'}
                              </Badge>
                              {ev.healthIssues && <Badge variant="outline" className="text-xs border-red-500/20 bg-red-500/10 text-red-400">Problemas de saude</Badge>}
                              {ev.medication && <Badge variant="outline" className="text-xs border-amber-500/20 bg-amber-500/10 text-amber-400">Toma medicamento</Badge>}
                              {ev.mainGoal && <Badge variant="outline" className="text-xs border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.08)] text-[#10B981]">Meta: {ev.mainGoal}</Badge>}
                              {ev.sleepQuality && <Badge variant="outline" className="text-xs border-border/50">Sono: {ev.sleepQuality}</Badge>}
                              {ev.stressLevel && <Badge variant="outline" className="text-xs border-border/50">Estresse: {ev.stressLevel}</Badge>}
                            </div>
                            {ev.healthDetails && <p className="text-xs text-muted-foreground">Detalhes saude: {ev.healthDetails}</p>}
                            {ev.medicationDetails && <p className="text-xs text-muted-foreground">Medicamentos: {ev.medicationDetails}</p>}
                          </div>

                          {/* Medidas + Fotos */}
                          <div className="bg-muted/20 rounded-2xl p-5 border border-border/30 space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                              <Ruler className="h-4 w-4 text-[#10B981]" /> Medidas + Fotos
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {ev.weight && (
                                <div className="bg-card rounded-xl p-3 border border-border/30">
                                  <p className="text-xs text-muted-foreground">Peso</p>
                                  <p className="font-bold text-lg text-foreground">{ev.weight} <span className="text-xs text-muted-foreground font-normal">kg</span></p>
                                </div>
                              )}
                              {ev.height && (
                                <div className="bg-card rounded-xl p-3 border border-border/30">
                                  <p className="text-xs text-muted-foreground">Altura</p>
                                  <p className="font-bold text-lg text-foreground">{ev.height} <span className="text-xs text-muted-foreground font-normal">cm</span></p>
                                </div>
                              )}
                              {ev.waist && (
                                <div className="bg-card rounded-xl p-3 border border-border/30">
                                  <p className="text-xs text-muted-foreground">Cintura</p>
                                  <p className="font-bold text-lg text-foreground">{ev.waist} <span className="text-xs text-muted-foreground font-normal">cm</span></p>
                                </div>
                              )}
                              {ev.abdomen && (
                                <div className="bg-card rounded-xl p-3 border border-border/30">
                                  <p className="text-xs text-muted-foreground">Abdomen</p>
                                  <p className="font-bold text-lg text-foreground">{ev.abdomen} <span className="text-xs text-muted-foreground font-normal">cm</span></p>
                                </div>
                              )}
                              {ev.hip && (
                                <div className="bg-card rounded-xl p-3 border border-border/30">
                                  <p className="text-xs text-muted-foreground">Quadril</p>
                                  <p className="font-bold text-lg text-foreground">{ev.hip} <span className="text-xs text-muted-foreground font-normal">cm</span></p>
                                </div>
                              )}
                              {ev.rightArm && (
                                <div className="bg-card rounded-xl p-3 border border-border/30">
                                  <p className="text-xs text-muted-foreground">Braco D</p>
                                  <p className="font-bold text-lg text-foreground">{ev.rightArm} <span className="text-xs text-muted-foreground font-normal">cm</span></p>
                                </div>
                              )}
                              {ev.leftArm && (
                                <div className="bg-card rounded-xl p-3 border border-border/30">
                                  <p className="text-xs text-muted-foreground">Braco E</p>
                                  <p className="font-bold text-lg text-foreground">{ev.leftArm} <span className="text-xs text-muted-foreground font-normal">cm</span></p>
                                </div>
                              )}
                              {ev.rightThigh && (
                                <div className="bg-card rounded-xl p-3 border border-border/30">
                                  <p className="text-xs text-muted-foreground">Coxa D</p>
                                  <p className="font-bold text-lg text-foreground">{ev.rightThigh} <span className="text-xs text-muted-foreground font-normal">cm</span></p>
                                </div>
                              )}
                              {ev.leftThigh && (
                                <div className="bg-card rounded-xl p-3 border border-border/30">
                                  <p className="text-xs text-muted-foreground">Coxa E</p>
                                  <p className="font-bold text-lg text-foreground">{ev.leftThigh} <span className="text-xs text-muted-foreground font-normal">cm</span></p>
                                </div>
                              )}
                            </div>
                            {(ev.photoFrontUrl || ev.photoBackUrl || ev.photoSideUrl) && (
                              <div className="grid grid-cols-3 gap-3 mt-2">
                                {ev.photoFrontUrl && (
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-muted-foreground text-center">Frente</p>
                                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted/50 ring-1 ring-border/20">
                                      <img src={ev.photoFrontUrl} alt="Frente" className="w-full h-full object-cover" />
                                    </div>
                                  </div>
                                )}
                                {ev.photoBackUrl && (
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-muted-foreground text-center">Costas</p>
                                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted/50 ring-1 ring-border/20">
                                      <img src={ev.photoBackUrl} alt="Costas" className="w-full h-full object-cover" />
                                    </div>
                                  </div>
                                )}
                                {ev.photoSideUrl && (
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-muted-foreground text-center">Lateral</p>
                                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted/50 ring-1 ring-border/20">
                                      <img src={ev.photoSideUrl} alt="Lateral" className="w-full h-full object-cover" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Objetivos + Termo */}
                          <div className="bg-muted/20 rounded-2xl p-5 border border-border/30 space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                              <Target className="h-4 w-4 text-[#10B981]" /> Objetivos + Termo
                            </h3>
                            {ev.specificGoal && (
                              <div className="bg-card rounded-xl p-3 border border-border/30">
                                <p className="text-xs text-muted-foreground">Objetivo especifico</p>
                                <p className="text-sm text-foreground font-medium mt-0.5">{ev.specificGoal}</p>
                              </div>
                            )}
                            {days.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">Dias de treino:</span>
                                {days.map((d: string) => (
                                  <Badge key={d} variant="outline" className="text-xs border-border/50 bg-card">{daysMap[d] ?? d}</Badge>
                                ))}
                              </div>
                            )}
                            {ev.studentNotes && (
                              <p className="text-sm text-muted-foreground">
                                <span className="text-foreground font-medium">Observacoes:</span> {ev.studentNotes}
                              </p>
                            )}
                            <div className="flex items-center gap-3 pt-1">
                              <Badge variant="outline" className={cn(
                                'text-xs',
                                ev.agreedTerms
                                  ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.2)]'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              )}>
                                {ev.agreedTerms ? 'Termo aceito' : 'Termo nao aceito'}
                              </Badge>
                              {ev.signatureName && (
                                <span className="text-xs text-muted-foreground">
                                  Assinatura: <span className="text-foreground">{ev.signatureName}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
