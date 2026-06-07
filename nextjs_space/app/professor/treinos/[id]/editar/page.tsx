import { EditarTreino } from '@/components/professor/editar-treino';

export default function EditarTreinoPage({ params }: { params: { id: string } }) {
  return <EditarTreino id={params?.id} />;
}
