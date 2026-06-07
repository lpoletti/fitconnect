'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, Dumbbell } from 'lucide-react';

interface Exercise {
  exerciseName: string;
  sets: number;
  reps: string;
  suggestedWeight: string;
  restTime: string;
  notes: string;
}

interface WorkoutFormProps {
  initialData?: {
    name: string;
    category: string;
    description: string;
    exercises: Exercise[];
  };
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

export function WorkoutForm({ initialData, onSubmit, submitLabel = 'Salvar', loading = false }: WorkoutFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [exercises, setExercises] = useState<Exercise[]>(
    initialData?.exercises?.length
      ? initialData.exercises.map((e: any) => ({
          exerciseName: e?.exerciseName ?? '',
          sets: e?.sets ?? 3,
          reps: e?.reps ?? '12',
          suggestedWeight: e?.suggestedWeight ?? '',
          restTime: e?.restTime ?? '',
          notes: e?.notes ?? '',
        }))
      : [{ exerciseName: '', sets: 3, reps: '12', suggestedWeight: '', restTime: '60s', notes: '' }]
  );

  const addExercise = () => {
    setExercises([...exercises, { exerciseName: '', sets: 3, reps: '12', suggestedWeight: '', restTime: '60s', notes: '' }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_: any, i: number) => i !== index));
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const updated = [...exercises];
    (updated[index] as any)[field] = value;
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, category, description, exercises });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome do Treino *</Label>
            <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Ex: Treino A - Peito e Tríceps" required />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Input value={category} onChange={(e: any) => setCategory(e.target.value)} placeholder="Ex: Hipertrofia, Força" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder="Descrição opcional do treino" rows={2} />
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" /> Exercícios
          </h3>
          <Button type="button" size="sm" variant="outline" onClick={addExercise} className="gap-1">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>

        {exercises.map((ex: Exercise, i: number) => (
          <div key={i} className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Exercício {i + 1}</span>
              {exercises.length > 1 && (
                <Button type="button" size="sm" variant="ghost" onClick={() => removeExercise(i)} className="text-destructive h-7 w-7 p-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Nome do Exercício *</Label>
                <Input value={ex.exerciseName} onChange={(e: any) => updateExercise(i, 'exerciseName', e.target.value)}
                  placeholder="Ex: Supino reto" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Séries</Label>
                  <Input type="number" min={1} value={ex.sets}
                    onChange={(e: any) => updateExercise(i, 'sets', parseInt(e.target.value) || 1)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Repetições</Label>
                  <Input value={ex.reps} onChange={(e: any) => updateExercise(i, 'reps', e.target.value)}
                    placeholder="12" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Carga Sugerida</Label>
                  <Input value={ex.suggestedWeight} onChange={(e: any) => updateExercise(i, 'suggestedWeight', e.target.value)}
                    placeholder="20kg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descanso</Label>
                  <Input value={ex.restTime} onChange={(e: any) => updateExercise(i, 'restTime', e.target.value)}
                    placeholder="60s" />
                </div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Observações</Label>
                <Input value={ex.notes} onChange={(e: any) => updateExercise(i, 'notes', e.target.value)}
                  placeholder="Observações sobre o exercício" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading} className="px-8">
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
