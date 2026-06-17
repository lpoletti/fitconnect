'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Dumbbell, Flame, Upload, Image, Video, X } from 'lucide-react';
import { toast } from 'sonner';

interface SetConfig {
  reps: string;
  weight: string;
  restTime: string;
}

interface WarmupSetConfig {
  reps: string;
  weight: string;
  weightUnit: 'kg' | 'percent';
  restTime: string;
}

interface MediaFile {
  url: string;
  type: string; // 'image' | 'video'
  path: string; // cloud_storage_path
}

interface Exercise {
  exerciseName: string;
  notes: string;
  setsConfig: SetConfig[];
  hasWarmup: boolean;
  warmupConfig: WarmupSetConfig[];
  mediaFiles: MediaFile[];
  uploading?: boolean;
}

interface WorkoutFormProps {
  initialData?: {
    name: string;
    category: string;
    description: string;
    exercises: any[];
  };
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

const defaultSet = (): SetConfig => ({ reps: '12', weight: '', restTime: '60s' });
const defaultWarmupSet = (): WarmupSetConfig => ({ reps: '15', weight: '50', weightUnit: 'percent', restTime: '30s' });

function parseExercise(e: any): Exercise {
  // Support new format (setsConfig) or legacy format
  let setsConfig: SetConfig[] = [];
  if (e?.setsConfig && Array.isArray(e.setsConfig) && e.setsConfig.length > 0) {
    setsConfig = e.setsConfig.map((s: any) => ({
      reps: s?.reps ?? '12',
      weight: s?.weight ?? '',
      restTime: s?.restTime ?? '60s',
    }));
  } else {
    // Legacy: expand flat fields into individual sets
    const count = e?.sets ?? 3;
    setsConfig = Array.from({ length: count }, () => ({
      reps: e?.reps ?? '12',
      weight: e?.suggestedWeight ?? '',
      restTime: e?.restTime ?? '60s',
    }));
  }

  let warmupConfig: WarmupSetConfig[] = [];
  if (e?.warmupConfig && Array.isArray(e.warmupConfig) && e.warmupConfig.length > 0) {
    warmupConfig = e.warmupConfig.map((s: any) => ({
      reps: s?.reps ?? '15',
      weight: s?.weight ?? '50',
      weightUnit: s?.weightUnit === 'kg' ? 'kg' : 'percent',
      restTime: s?.restTime ?? '30s',
    }));
  } else if (e?.hasWarmup) {
    const count = e?.warmupSets ?? 2;
    warmupConfig = Array.from({ length: count }, () => ({
      reps: e?.warmupReps ?? '15',
      weight: e?.warmupWeight ?? '50',
      weightUnit: 'percent' as const,
      restTime: '30s',
    }));
  }

  return {
    exerciseName: e?.exerciseName ?? '',
    notes: e?.notes ?? '',
    setsConfig: setsConfig.length > 0 ? setsConfig : [defaultSet()],
    hasWarmup: e?.hasWarmup ?? false,
    warmupConfig: warmupConfig.length > 0 ? warmupConfig : [defaultWarmupSet()],
    mediaFiles: parseMediaFiles(e),
  };
}

function toSupabasePublicUrl(urlOrPath: string): string {
  if (!urlOrPath) return '';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    if (urlOrPath.includes('supabase.co/storage')) return urlOrPath;
    const pathMatch = urlOrPath.match(/\/(public\/uploads\/.+|uploads\/.+)/);
    if (pathMatch) {
      return supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/exercise-media/${pathMatch[1]}` : urlOrPath;
    }
    return urlOrPath;
  }
  if (supabaseUrl) {
    const cleanPath = urlOrPath.replace(/^\d+\//, '');
    return `${supabaseUrl}/storage/v1/object/public/exercise-media/${cleanPath}`;
  }
  return urlOrPath;
}

function parseMediaFiles(e: any): MediaFile[] {
  const bucket = 'exercise-media';
  if (e?.mediaFiles && Array.isArray(e.mediaFiles) && e.mediaFiles.length > 0) {
    return e.mediaFiles.map((m: any) => ({
      url: toSupabasePublicUrl(m.url ?? m.path ?? ''),
      type: m.type ?? 'image',
      path: m.path ?? '',
    }));
  }
  if (e?.mediaUrl) {
    return [{
      url: toSupabasePublicUrl(e.mediaUrl),
      type: e.mediaType ?? 'image',
      path: e.mediaPath ?? '',
    }];
  }
  return [];
}

const defaultExercise = (): Exercise => ({
  exerciseName: '',
  notes: '',
  setsConfig: [defaultSet(), defaultSet(), defaultSet()],
  hasWarmup: false,
  warmupConfig: [defaultWarmupSet()],
  mediaFiles: [],
});

export function WorkoutForm({ initialData, onSubmit, submitLabel = 'Salvar', loading = false }: WorkoutFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [exercises, setExercises] = useState<Exercise[]>(
    initialData?.exercises?.length
      ? initialData.exercises.map(parseExercise)
      : [defaultExercise()]
  );

  const addExercise = () => setExercises([...exercises, defaultExercise()]);
  const removeExercise = (i: number) => setExercises(exercises.filter((_: any, idx: number) => idx !== i));

  const updateExercise = (i: number, field: string, value: any) => {
    const updated = [...exercises];
    (updated[i] as any)[field] = value;
    setExercises(updated);
  };

  const updateSet = (exIdx: number, setIdx: number, field: string, value: string) => {
    const updated = [...exercises];
    (updated[exIdx].setsConfig[setIdx] as any)[field] = value;
    setExercises(updated);
  };

  const addSet = (exIdx: number) => {
    const updated = [...exercises];
    const lastSet = updated[exIdx].setsConfig[updated[exIdx].setsConfig.length - 1];
    updated[exIdx].setsConfig.push({ ...lastSet });
    setExercises(updated);
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    const updated = [...exercises];
    if (updated[exIdx].setsConfig.length > 1) {
      updated[exIdx].setsConfig.splice(setIdx, 1);
      setExercises(updated);
    }
  };

  const updateWarmupSet = (exIdx: number, setIdx: number, field: string, value: string) => {
    const updated = [...exercises];
    (updated[exIdx].warmupConfig[setIdx] as any)[field] = value;
    setExercises(updated);
  };

  const addWarmupSet = (exIdx: number) => {
    const updated = [...exercises];
    const lastSet = updated[exIdx].warmupConfig[updated[exIdx].warmupConfig.length - 1];
    updated[exIdx].warmupConfig.push({ ...lastSet });
    setExercises(updated);
  };

  const removeWarmupSet = (exIdx: number, setIdx: number) => {
    const updated = [...exercises];
    if (updated[exIdx].warmupConfig.length > 1) {
      updated[exIdx].warmupConfig.splice(setIdx, 1);
      setExercises(updated);
    }
  };

  const handleMediaUpload = async (exIdx: number, file: File) => {
    const ex = exercises[exIdx];
    if (ex.mediaFiles.length >= 3) {
      toast.error('Máximo de 3 mídias por exercício.');
      return;
    }
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(file.type.startsWith('video/') ? 'Vídeo: máx 100MB' : 'Imagem: máx 10MB');
      return;
    }
    setExercises(prev => prev.map((e, idx) => idx === exIdx ? { ...e, uploading: true } : e));

    try {
      const res = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? 'Erro ao gerar URL');
      }
      const { uploadUrl, cloud_storage_path, mediaType } = await res.json();

      const url = new URL(uploadUrl);
      const signedHeaders = url.searchParams.get('X-Amz-SignedHeaders') ?? '';
      const headers: Record<string, string> = { 'Content-Type': file.type };
      if (signedHeaders.includes('content-disposition')) {
        headers['Content-Disposition'] = 'attachment';
      }

      const uploadRes = await fetch(uploadUrl, { method: 'PUT', headers, body: file });
      if (!uploadRes.ok) throw new Error('Erro no upload');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const bucketName = 'exercise-media';
      let publicUrl = '';
      if (supabaseUrl) {
        publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cloud_storage_path}`;
      }

      const newMedia: MediaFile = {
        url: publicUrl || cloud_storage_path,
        type: mediaType,
        path: cloud_storage_path,
      };

      setExercises(prev => prev.map((e, idx) => idx === exIdx ? {
        ...e,
        mediaFiles: [...e.mediaFiles, newMedia],
        uploading: false,
      } : e));
      toast.success('Mídia enviada com sucesso!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro no upload');
      setExercises(prev => prev.map((e, idx) => idx === exIdx ? { ...e, uploading: false } : e));
    }
  };

  const removeMedia = (exIdx: number, mediaIdx: number) => {
    const updated = [...exercises];
    updated[exIdx] = {
      ...updated[exIdx],
      mediaFiles: updated[exIdx].mediaFiles.filter((_, idx) => idx !== mediaIdx),
    };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, category, description, exercises });
  };

  const [failedMedia, setFailedMedia] = useState<Set<string>>(new Set());
  const markMediaFailed = (exIdx: number, mi: number) => setFailedMedia(prev => new Set(prev).add(`${exIdx}-${mi}`));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Workout info */}
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

      {/* Exercises */}
      <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-md)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" /> Exercícios
          </h3>
          <Button type="button" size="sm" variant="outline" onClick={addExercise} className="gap-1">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>

        {exercises.map((ex, i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-4 space-y-4">
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
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Observações</Label>
                <Input value={ex.notes} onChange={(e: any) => updateExercise(i, 'notes', e.target.value)}
                  placeholder="Observações sobre o exercício" />
              </div>

              {/* Media upload - multiple files (max 3) */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs flex items-center gap-1">
                  <Upload className="h-3 w-3" /> Mídias de Execução ({ex.mediaFiles.filter((_, mi) => !failedMedia.has(`${i}-${mi}`)).length}/3)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ex.mediaFiles.map((media, mi) => (
                    failedMedia.has(`${i}-${mi}`) ? null : (
                    <div key={mi} className="relative inline-block group">
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt={`Mídia ${mi + 1}`}
                          className="h-20 w-20 rounded-lg object-cover bg-muted"
                          onError={() => markMediaFailed(i, mi)}
                        />
                      ) : (
                        <video
                          src={media.url}
                          preload="metadata"
                          className="h-20 w-20 rounded-lg object-cover bg-muted"
                          onError={() => markMediaFailed(i, mi)}
                        />
                      )}
                      <button type="button" onClick={() => removeMedia(i, mi)}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    )
                  ))}
                  {ex.mediaFiles.filter((_, mi) => !failedMedia.has(`${i}-${mi}`)).length < 3 && (
                    <label className={`flex flex-col items-center justify-center h-20 w-20 rounded-lg border border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                      ex.uploading ? 'opacity-50 pointer-events-none' : ''
                    }`}>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                        onChange={(e: any) => {
                          const file = e.target.files?.[0];
                          if (file) handleMediaUpload(i, file);
                          e.target.value = '';
                        }}
                      />
                      {ex.uploading ? (
                        <span className="text-[10px] text-muted-foreground">Enviando...</span>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground mt-0.5">Foto/Vídeo</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
                {ex.mediaFiles.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">Foto (máx 10MB) ou Vídeo (máx 100MB)</p>
                )}
              </div>
            </div>

            {/* Individual Sets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Séries ({ex.setsConfig.length})</Label>
                <Button type="button" size="sm" variant="ghost" onClick={() => addSet(i)} className="h-6 px-2 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Série
                </Button>
              </div>
              <div className="space-y-1.5">
                {/* Header */}
                <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 px-1">
                  <span className="w-6" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">Reps</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">Carga</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">Descanso</span>
                  <span className="w-6" />
                </div>
                {ex.setsConfig.map((set, si) => (
                  <div key={si} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-center">
                    <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{si + 1}</span>
                    <Input value={set.reps} onChange={(e: any) => updateSet(i, si, 'reps', e.target.value)}
                      placeholder="12" className="h-8 text-sm" />
                    <Input value={set.weight} onChange={(e: any) => updateSet(i, si, 'weight', e.target.value)}
                      placeholder="20kg" className="h-8 text-sm" />
                    <Input value={set.restTime} onChange={(e: any) => updateSet(i, si, 'restTime', e.target.value)}
                      placeholder="60s" className="h-8 text-sm" />
                    {ex.setsConfig.length > 1 ? (
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeSet(i, si)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : <span className="w-6" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Warmup toggle */}
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className={`h-4 w-4 ${ex.hasWarmup ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  <Label className="text-xs font-medium cursor-pointer">Séries de Aquecimento</Label>
                </div>
                <Switch
                  checked={ex.hasWarmup}
                  onCheckedChange={(checked: boolean) => updateExercise(i, 'hasWarmup', checked)}
                />
              </div>

              {ex.hasWarmup && (
                <div className="mt-3 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-orange-700 dark:text-orange-400 font-medium flex items-center gap-1">
                      <Flame className="h-3 w-3" /> Aquecimento ({ex.warmupConfig.length} {ex.warmupConfig.length === 1 ? 'série' : 'séries'})
                    </p>
                    <Button type="button" size="sm" variant="ghost" onClick={() => addWarmupSet(i)}
                      className="h-6 px-2 text-xs gap-1 text-orange-700 dark:text-orange-400 hover:text-orange-800">
                      <Plus className="h-3 w-3" /> Série
                    </Button>
                  </div>
                  <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70">
                    Carga leve (35-50% da carga máxima) para aquecer articulações e elevar temperatura corporal.
                  </p>

                  {/* Warmup header */}
                  <div className="grid grid-cols-[auto_1fr_1fr_auto_1fr_auto] gap-2 px-1">
                    <span className="w-5" />
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium uppercase">Reps</span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium uppercase">Carga</span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium uppercase w-14">Unid.</span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium uppercase">Descanso</span>
                    <span className="w-6" />
                  </div>

                  {ex.warmupConfig.map((ws, wi) => (
                    <div key={wi} className="grid grid-cols-[auto_1fr_1fr_auto_1fr_auto] gap-2 items-center">
                      <span className="w-5 h-5 rounded bg-orange-200/50 dark:bg-orange-800/30 flex items-center justify-center text-[10px] font-bold text-orange-700 dark:text-orange-400">
                        {wi + 1}
                      </span>
                      <Input value={ws.reps} onChange={(e: any) => updateWarmupSet(i, wi, 'reps', e.target.value)}
                        placeholder="15" className="h-7 text-xs" />
                      <Input value={ws.weight} onChange={(e: any) => updateWarmupSet(i, wi, 'weight', e.target.value)}
                        placeholder={ws.weightUnit === 'percent' ? '50' : '10'} className="h-7 text-xs" />
                      <select
                        value={ws.weightUnit}
                        onChange={(e: any) => updateWarmupSet(i, wi, 'weightUnit', e.target.value)}
                        className="h-7 w-14 rounded-md border border-input bg-background px-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="percent">%</option>
                        <option value="kg">kg</option>
                      </select>
                      <Input value={ws.restTime} onChange={(e: any) => updateWarmupSet(i, wi, 'restTime', e.target.value)}
                        placeholder="30s" className="h-7 text-xs" />
                      {ex.warmupConfig.length > 1 ? (
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeWarmupSet(i, wi)}
                          className="h-6 w-6 p-0 text-orange-400 hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      ) : <span className="w-6" />}
                    </div>
                  ))}
                </div>
              )}
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
