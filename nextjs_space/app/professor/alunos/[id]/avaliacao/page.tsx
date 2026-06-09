import { AvaliacaoAluno } from '@/components/professor/avaliacao-aluno';

export default function AvaliacaoPage({ params }: { params: { id: string } }) {
  return <AvaliacaoAluno studentId={params?.id} />;
}
