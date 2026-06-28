export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const workout = await prisma.assignedWorkout.findFirst({
      where: { id: params?.id, studentId: session.user.studentId },
    });
    if (!workout) return NextResponse.json({ error: 'Treino nao encontrado' }, { status: 404 });

    const existing = await prisma.workoutLog.findFirst({
      where: {
        assignedWorkoutId: params.id,
        studentId: session.user.studentId,
        status: 'in_progress',
      },
    });

    if (existing) {
      return NextResponse.json({ logId: existing.id, startedAt: existing.startedAt, resumed: true });
    }

    const log = await prisma.workoutLog.create({
      data: {
        studentId: session.user.studentId,
        assignedWorkoutId: params.id,
        status: 'in_progress',
        startedAt: new Date(),
      },
    });

    return NextResponse.json({ logId: log.id, startedAt: log.startedAt, resumed: false }, { status: 201 });
  } catch (error: any) {
    console.error('Start workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
