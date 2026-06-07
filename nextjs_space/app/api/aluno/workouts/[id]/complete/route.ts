export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { exerciseLogs, notes } = body ?? {};

    // Verify workout belongs to student
    const workout = await prisma.assignedWorkout.findFirst({
      where: { id: params?.id, studentId: session.user.studentId },
    });
    if (!workout) return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 });

    const log = await prisma.workoutLog.create({
      data: {
        studentId: session.user.studentId,
        assignedWorkoutId: params.id,
        notes: notes ?? null,
        exerciseLogs: {
          create: (exerciseLogs ?? []).map((el: any) => ({
            exerciseName: el?.exerciseName ?? '',
            setsCompleted: el?.setsCompleted ?? 0,
            repsCompleted: el?.repsCompleted ?? '0',
            weightUsed: el?.weightUsed ?? null,
            notes: el?.notes ?? null,
            setsLog: el?.setsLog ?? null,
            warmupLog: el?.warmupLog ?? null,
          })),
        },
      },
      include: { exerciseLogs: true },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    console.error('Complete workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
