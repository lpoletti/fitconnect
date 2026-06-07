import { AtribuirTreino } from '@/components/professor/atribuir-treino';

export default function AtribuirTreinoPage({ params }: { params: { id: string } }) {
  return <AtribuirTreino studentId={params?.id} />;
}
