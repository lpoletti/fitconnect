export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const workout = await prisma.assignedWorkout.findFirst({
      where: { id: params?.id, studentId: session.user.studentId },
      include: {
        exercises: { orderBy: { order: 'asc' } },
        professor: { include: { user: { select: { name: true } } } },
      },
    });
    if (!workout) return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 });

    return NextResponse.json(workout);
  } catch (error: any) {
    console.error('Get workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
