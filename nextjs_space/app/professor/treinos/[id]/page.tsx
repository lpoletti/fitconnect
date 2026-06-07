import { TreinoDetail } from '@/components/professor/treino-detail';

export default function TreinoDetailPage({ params }: { params: { id: string } }) {
  return <TreinoDetail id={params?.id} />;
}
