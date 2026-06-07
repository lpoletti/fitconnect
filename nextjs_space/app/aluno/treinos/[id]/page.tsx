import { ExecutarTreino } from '@/components/aluno/executar-treino';

export default function ExecutarTreinoPage({ params }: { params: { id: string } }) {
  return <ExecutarTreino workoutId={params?.id} />;
}
