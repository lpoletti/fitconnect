export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { status } = body ?? {};
    if (!['active', 'inactive', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    // If activating, check limit
    if (status === 'active') {
      const activeCount = await prisma.studentProfessorLink.count({
        where: { professorId: session.user.professorId, status: 'active' },
      });
      const professor = await prisma.professor.findUnique({
        where: { id: session.user.professorId },
      });
      if (activeCount >= (professor?.maxStudents ?? 2)) {
        return NextResponse.json({ error: 'Limite de alunos ativos atingido.' }, { status: 403 });
      }
    }

    const link = await prisma.studentProfessorLink.update({
      where: { id: params?.id, professorId: session.user.professorId },
      data: { status },
    });

    return NextResponse.json(link);
  } catch (error: any) {
    console.error('Update student link error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
