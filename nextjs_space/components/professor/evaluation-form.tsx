'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ChevronDown, ChevronUp, User, Ruler, Target,
  Upload, Camera, Heart, Moon, Brain, Dumbbell, X,
} from 'lucide-react';

interface PhotoUpload {
  url: string;
  path: string;
  uploading: boolean;
}

interface EvaluationFormProps {
  studentId: string;
  studentName: string;
  studentEmail: string;
  onSuccess: () => void;
}

const GOALS = [
  { value: 'emagrecer', label: 'Emagrecer' },
  { value: 'hipertrofiar', label: 'Hipertrofiar' },
  { value: 'definir', label: 'Definir' },
  { value: 'condicionamento', label: 'Condicionamento' },
  { value: 'saude', label: 'Saúde' },
];

const SLEEP = [
  { value: 'ruim', label: 'Ruim' },
  { value: 'regular', label: 'Regular' },
  { value: 'boa', label: 'Boa' },
];

const STRESS = [
  { value: 'baixo', label: 'Baixo' },
  { value: 'medio', label: 'Médio' },
  { value: 'alto', label: 'Alto' },
];

const DAYS = [
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
  { value: 'sab', label: 'Sáb' },
  { value: 'dom', label: 'Dom' },
];

export function EvaluationForm({ studentId, studentName, studentEmail, onSuccess }: EvaluationFormProps) {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: true, 2: false, 3: false });
  const [loading, setLoading] = useState(false);

  // Section 1
  const [name, setName] = useState(studentName);
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(studentEmail);
  const [previousTraining, setPreviousTraining] = useState(false);
  const [healthIssues, setHealthIssues] = useState(false);
  const [healthDetails, setHealthDetails] = useState('');
  const [medication, setMedication] = useState(false);
  const [medicationDetails, setMedicationDetails] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [stressLevel, setStressLevel] = useState('');

  // Section 2
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [waist, setWaist] = useState('');
  const [abdomen, setAbdomen] = useState('');
  const [hip, setHip] = useState('');
  const [rightArm, setRightArm] = useState('');
  const [leftArm, setLeftArm] = useState('');
  const [rightThigh, setRightThigh] = useState('');
  const [leftThigh, setLeftThigh] = useState('');
  const [photoFront, setPhotoFront] = useState<PhotoUpload>({ url: '', path: '', uploading: false });
  const [photoBack, setPhotoBack] = useState<PhotoUpload>({ url: '', path: '', uploading: false });
  const [photoSide, setPhotoSide] = useState<PhotoUpload>({ url: '', path: '', uploading: false });

  // Section 3
  const [specificGoal, setSpecificGoal] = useState('');
  const [trainingDays, setTrainingDays] = useState<string[]>([]);
  const [studentNotes, setStudentNotes] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  const toggle = (s: number) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));

  const toggleDay = (d: string) => {
    setTrainingDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handlePhotoUpload = async (
    file: File,
    setter: React.Dispatch<React.SetStateAction<PhotoUpload>>,
  ) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Foto deve ter no máximo 10MB.');
      return;
    }
    setter(prev => ({ ...prev, uploading: true }));
    try {
      const res = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
      });
      if (!res.ok) throw new Error('Erro ao gerar URL');
      const { uploadUrl, cloud_storage_path } = await res.json();

      const url = new URL(uploadUrl);
      const signedHeaders = url.searchParams.get('X-Amz-SignedHeaders') ?? '';
      const headers: Record<string, string> = { 'Content-Type': file.type };
      if (signedHeaders.includes('content-disposition')) headers['Content-Disposition'] = 'attachment';

      const uploadRes = await fetch(uploadUrl, { method: 'PUT', headers, body: file });
      if (!uploadRes.ok) throw new Error('Erro no upload');

      const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
      const region = process.env.NEXT_PUBLIC_AWS_REGION;
      let publicUrl = cloud_storage_path;
      if (bucketName && region) publicUrl = `https://i.ytimg.com/vi/LeDjXowdrXg/maxresdefault.jpg`;

      setter({ url: publicUrl, path: cloud_storage_path, uploading: false });
      toast.success('Foto enviada!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro no upload');
      setter(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Nome é obrigatório.'); toggle(1); return; }
    if (!photoFront.url || !photoBack.url || !photoSide.url) {
      toast.error('As 3 fotos são obrigatórias.');
      setOpenSections(prev => ({ ...prev, 2: true }));
      return;
    }
    if (!agreedTerms) {
      toast.error('Aceite o termo para continuar.');
      setOpenSections(prev => ({ ...prev, 3: true }));
      return;
    }
    if (!signatureName.trim()) {
      toast.error('Assinatura digital é obrigatória.');
      setOpenSections(prev => ({ ...prev, 3: true }));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/professor/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          name, birthDate: birthDate || null, sex: sex || null,
          phone: phone || null, email: email || null,
          previousTraining, healthIssues, healthDetails: healthIssues ? healthDetails : null,
          medication, medicationDetails: medication ? medicationDetails : null,
          mainGoal: mainGoal || null, sleepQuality: sleepQuality || null, stressLevel: stressLevel || null,
          weight: weight || null, height: height || null,
          waist: waist || null, abdomen: abdomen || null, hip: hip || null,
          rightArm: rightArm || null, leftArm: leftArm || null,
          rightThigh: rightThigh || null, leftThigh: leftThigh || null,
          photoFront: photoFront.path, photoFrontUrl: photoFront.url,
          photoBack: photoBack.path, photoBackUrl: photoBack.url,
          photoSide: photoSide.path, photoSideUrl: photoSide.url,
          specificGoal: specificGoal || null,
          trainingDays: trainingDays.length > 0 ? trainingDays : null,
          studentNotes: studentNotes || null,
          agreedTerms, signatureName,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? 'Erro ao salvar');
      }
      toast.success('Avaliação salva com sucesso!');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao salvar avaliação');
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ num, title, icon: Icon, isOpen }: { num: number; title: string; icon: any; isOpen: boolean }) => (
    <button
      type="button"
      onClick={() => toggle(num)}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-card shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow min-h-[44px]"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{num}</div>
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-display font-semibold text-base">{title}</span>
      </div>
      {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
    </button>
  );

  const PhotoUploader = ({ label, photo, setter }: { label: string; photo: PhotoUpload; setter: React.Dispatch<React.SetStateAction<PhotoUpload>> }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label} *</Label>
      {photo.url ? (
        <div className="relative inline-block">
          <img src={photo.url} alt={label} className="h-32 w-24 rounded-lg object-cover" />
          <button type="button" onClick={() => setter({ url: '', path: '', uploading: false })}
            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center h-32 w-24 rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors ${
          photo.uploading ? 'opacity-50 pointer-events-none' : ''
        }`}>
          <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp"
            onChange={(e: any) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f, setter); e.target.value = ''; }} />
          {photo.uploading ? (
            <span className="text-[10px] text-muted-foreground">Enviando...</span>
          ) : (
            <>
              <Camera className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-[10px] text-muted-foreground text-center px-1">{label}</span>
            </>
          )}
        </label>
      )}
    </div>
  );

  const SelectField = ({ label, value, onChange, options, icon: Icon }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; icon?: any }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </Label>
      <select
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Selecione...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* SECTION 1 */}
      <SectionHeader num={1} title="Dados + Anamnese" icon={User} isOpen={!!openSections[1]} />
      {openSections[1] && (
        <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-sm)] space-y-4 animate-in fade-in duration-200">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome Completo *</Label>
              <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Nome do aluno" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data de Nascimento</Label>
              <Input type="date" value={birthDate} onChange={(e: any) => setBirthDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sexo</Label>
              <select value={sex} onChange={(e: any) => setSex(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione...</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Anamnese</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Já treinou antes?</Label>
                <Switch checked={previousTraining} onCheckedChange={setPreviousTraining} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Tem problema de saúde?</Label>
                <Switch checked={healthIssues} onCheckedChange={setHealthIssues} />
              </div>
              {healthIssues && (
                <Textarea value={healthDetails} onChange={(e: any) => setHealthDetails(e.target.value)}
                  placeholder="Descreva os problemas de saúde..." rows={2} />
              )}
              <div className="flex items-center justify-between">
                <Label className="text-sm">Medicação contínua?</Label>
                <Switch checked={medication} onCheckedChange={setMedication} />
              </div>
              {medication && (
                <Textarea value={medicationDetails} onChange={(e: any) => setMedicationDetails(e.target.value)}
                  placeholder="Quais medicações?" rows={2} />
              )}
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="Objetivo Principal" value={mainGoal} onChange={setMainGoal} options={GOALS} icon={Target} />
              <SelectField label="Qualidade do Sono" value={sleepQuality} onChange={setSleepQuality} options={SLEEP} icon={Moon} />
              <SelectField label="Nível de Estresse" value={stressLevel} onChange={setStressLevel} options={STRESS} icon={Brain} />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2 */}
      <SectionHeader num={2} title="Medidas + Fotos" icon={Ruler} isOpen={!!openSections[2]} />
      {openSections[2] && (
        <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-sm)] space-y-4 animate-in fade-in duration-200">
          <h4 className="font-medium text-sm">Medidas Corporais</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Peso (kg)', value: weight, set: setWeight },
              { label: 'Altura (cm)', value: height, set: setHeight },
              { label: 'Cintura (cm)', value: waist, set: setWaist },
              { label: 'Abdômen (cm)', value: abdomen, set: setAbdomen },
              { label: 'Quadril (cm)', value: hip, set: setHip },
              { label: 'Braço D (cm)', value: rightArm, set: setRightArm },
              { label: 'Braço E (cm)', value: leftArm, set: setLeftArm },
              { label: 'Coxa D (cm)', value: rightThigh, set: setRightThigh },
              { label: 'Coxa E (cm)', value: leftThigh, set: setLeftThigh },
            ].map((f) => (
              <div key={f.label} className="space-y-1">
                <Label className="text-[11px]">{f.label}</Label>
                <Input type="number" step="0.1" value={f.value} onChange={(e: any) => f.set(e.target.value)}
                  placeholder="0" className="h-9" />
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-primary" /> Fotos Corporais <span className="text-destructive text-xs">(obrigatórias)</span>
            </h4>
            <div className="flex flex-wrap gap-4">
              <PhotoUploader label="Frente" photo={photoFront} setter={setPhotoFront} />
              <PhotoUploader label="Costas" photo={photoBack} setter={setPhotoBack} />
              <PhotoUploader label="Perfil" photo={photoSide} setter={setPhotoSide} />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3 */}
      <SectionHeader num={3} title="Objetivos + Termo" icon={Target} isOpen={!!openSections[3]} />
      {openSections[3] && (
        <div className="bg-card rounded-xl p-5 shadow-[var(--shadow-sm)] space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <Label className="text-xs">Meta Específica</Label>
            <Input value={specificGoal} onChange={(e: any) => setSpecificGoal(e.target.value)}
              placeholder="Ex: perder 5kg em 3 meses" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Dias de Treino Disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(d => (
                <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
                    trainingDays.includes(d.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Observações do Aluno</Label>
            <Textarea value={studentNotes} onChange={(e: any) => setStudentNotes(e.target.value)}
              placeholder="Observações adicionais..." rows={3} />
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
              Declaro que as informações prestadas nesta avaliação são verdadeiras e completas.
              Autorizo o(a) professor(a) a utilizar esses dados para a elaboração do meu programa de treinamento.
              Estou ciente de que devo informar qualquer alteração no meu estado de saúde.
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreedTerms}
                onCheckedChange={(checked: boolean) => setAgreedTerms(checked)}
              />
              <Label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
                Li e concordo com o termo acima
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Assinatura Digital (nome completo) *</Label>
              <Input value={signatureName} onChange={(e: any) => setSignatureName(e.target.value)}
                placeholder="Nome completo do aluno" className="font-serif italic" />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={handleSubmit} disabled={loading} className="px-8 min-h-[44px]">
          {loading ? 'Salvando...' : 'Salvar Avaliação'}
        </Button>
      </div>
    </div>
  );
}
