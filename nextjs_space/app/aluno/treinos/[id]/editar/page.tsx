import { EditarTreinoPessoal } from '@/components/aluno/editar-treino-pessoal';

export default function Page({ params }: { params: { id: string } }) {
  return <EditarTreinoPessoal id={params.id} />;
}
