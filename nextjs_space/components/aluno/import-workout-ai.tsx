'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { WorkoutForm } from '@/components/professor/workout-form';
import { toast } from 'sonner';
import {
  Sparkles, ChevronLeft, ChevronRight, Save, Loader2, FileText, AlertCircle, CheckCircle2, StickyNote
} from 'lucide-react';

interface ImportWorkoutAIProps {
  onClose: () => void;
  onSaved: () => void;
}

type Step = 'input' | 'processing' | 'preview';

export function ImportWorkoutAI({ onClose, onSaved }: ImportWorkoutAIProps) {
  const [step, setStep] = useState<Step>('input');
  const [rawText, setRawText] = useState('');
  const [parsedWorkouts, setParsedWorkouts] = useState<any[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [currentWorkoutIdx, setCurrentWorkoutIdx] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());

  const handleProcess = async () => {
    if (!rawText.trim() || rawText.trim().length < 20) {
      toast.error('Cole o texto completo do treino (mínimo 20 caracteres).');
      return;
    }
    setProcessing(true);
    setStep('processing');
    try {
      const res = await fetch('/api/aluno/workouts/import-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Erro ao processar.');
        setStep('input');
        return;
      }
      setParsedWorkouts(data.workouts ?? []);
      setGeneralNotes(data.generalNotes ?? '');
      setCurrentWorkoutIdx(0);
      setSavedIndexes(new Set());
      setStep('preview');
      toast.success(`${data.workouts.length} treino(s) encontrado(s)!`);
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
      setStep('input');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveWorkout = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/aluno/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutName: data.name,
          category: data.category,
          description: data.description,
          exercises: data.exercises,
        }),
      });
      if (res.ok) {
        toast.success(`Treino "${data.name}" salvo!`);
        setSavedIndexes((prev) => new Set(prev).add(currentWorkoutIdx));
      } else {
        const d = await res.json();
        toast.error(d?.error ?? 'Erro ao salvar treino.');
      }
    } catch {
      toast.error('Erro ao salvar treino.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    let successCount = 0;
    for (let i = 0; i < parsedWorkouts.length; i++) {
      if (savedIndexes.has(i)) continue;
      const w = parsedWorkouts[i];
      try {
        const res = await fetch('/api/aluno/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workoutName: w.name,
            category: w.category ?? '',
            description: w.description ?? '',
            exercises: w.exercises ?? [],
          }),
        });
        if (res.ok) {
          successCount++;
          setSavedIndexes((prev) => new Set(prev).add(i));
        }
      } catch { /* continue */ }
    }
    setSaving(false);
    if (successCount > 0) {
      toast.success(`${successCount} treino(s) salvo(s) com sucesso!`);
      if (successCount + savedIndexes.size - successCount >= parsedWorkouts.length) {
        onSaved();
      }
    } else {
      toast.error('Não foi possível salvar os treinos.');
    }
  };

  const currentWorkout = parsedWorkouts[currentWorkoutIdx];
  const allSaved = parsedWorkouts.length > 0 && parsedWorkouts.every((_, i) => savedIndexes.has(i));
  const unsavedCount = parsedWorkouts.length - savedIndexes.size;

  return (
    <div className="space-y-4">
      {/* Step: Input */}
      {step === 'input' && (
        <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Importar Treino com IA</h2>
              <p className="text-xs text-muted-foreground">Cole o texto do seu treino e a IA vai estruturar tudo automaticamente</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Texto do Treino</Label>
            <Textarea
              value={rawText}
              onChange={(e: any) => setRawText(e.target.value)}
              placeholder={'Cole aqui o texto completo do treino...\n\nExemplo:\nDia 1 (Peito e Tríceps)\n1. Supino reto\n3 séries de aquecimento...\n3 séries válidas: 12 repetições...'}
              rows={14}
              className="font-mono text-sm resize-y min-h-[200px]"
            />
            <p className="text-[11px] text-muted-foreground">
              Aceita qualquer formato de texto. A IA identifica exercícios, séries, aquecimento, descanso e observações automaticamente.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              type="button"
              onClick={handleProcess}
              disabled={!rawText.trim() || rawText.trim().length < 20}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="h-4 w-4" /> Processar com IA
            </Button>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="bg-card rounded-xl p-10 shadow-[var(--shadow-md)] text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Processando treino...</h3>
            <p className="text-sm text-muted-foreground mt-1">A IA está analisando e estruturando seus exercícios. Isso pode levar alguns segundos.</p>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && currentWorkout && (
        <div className="space-y-4">
          {/* Navigation bar */}
          <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span className="font-display font-semibold">
                  Treino {currentWorkoutIdx + 1} de {parsedWorkouts.length}
                </span>
                {savedIndexes.has(currentWorkoutIdx) && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Salvo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button" size="sm" variant="outline"
                  disabled={currentWorkoutIdx === 0}
                  onClick={() => setCurrentWorkoutIdx((p) => p - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <Button
                  type="button" size="sm" variant="outline"
                  disabled={currentWorkoutIdx === parsedWorkouts.length - 1}
                  onClick={() => setCurrentWorkoutIdx((p) => p + 1)}
                  className="gap-1"
                >
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Workout list pills */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {parsedWorkouts.map((w, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentWorkoutIdx(i)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                    i === currentWorkoutIdx
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : savedIndexes.has(i)
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {savedIndexes.has(i) && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
                  {w.name?.substring(0, 25) || `Treino ${i + 1}`}
                </button>
              ))}
            </div>
          </div>

          {/* General notes */}
          {generalNotes && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <StickyNote className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Observações Gerais</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 whitespace-pre-line">{generalNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Editable workout form */}
          <WorkoutForm
            key={`import-${currentWorkoutIdx}`}
            initialData={{
              name: currentWorkout.name ?? '',
              category: currentWorkout.category ?? '',
              description: currentWorkout.description ?? '',
              exercises: currentWorkout.exercises ?? [],
            }}
            onSubmit={handleSaveWorkout}
            submitLabel={savedIndexes.has(currentWorkoutIdx) ? 'Já Salvo ✓' : 'Salvar Este Treino'}
            loading={saving}
          />

          {/* Bottom actions */}
          <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => { setStep('input'); setParsedWorkouts([]); }} className="gap-1">
                  <FileText className="h-4 w-4" /> Novo Texto
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>Fechar</Button>
              </div>
              <div className="flex items-center gap-3">
                {unsavedCount > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {unsavedCount} não salvo(s)
                  </span>
                )}
                {allSaved ? (
                  <Button type="button" onClick={() => { onSaved(); }} className="gap-2 bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="h-4 w-4" /> Todos Salvos — Concluir
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving || allSaved}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvando...' : `Salvar Todos (${unsavedCount})`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
