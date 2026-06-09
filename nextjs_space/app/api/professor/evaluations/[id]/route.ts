export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: single evaluation
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const evaluation = await prisma.studentEvaluation.findFirst({
      where: { id: params.id, professorId: session.user.professorId },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
      },
    });
    if (!evaluation) return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 });

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error('Get evaluation error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    await prisma.studentEvaluation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Avaliação excluída' });
  } catch (error: any) {
    console.error('Delete evaluation error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
