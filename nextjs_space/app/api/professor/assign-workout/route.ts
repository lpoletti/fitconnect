export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { studentId, workoutName, startDate, exercises } = body ?? {};

    if (!studentId || !workoutName || !exercises || (exercises ?? []).length === 0) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Verify student is linked
    const link = await prisma.studentProfessorLink.findFirst({
      where: {
        studentId,
        professorId: session.user.professorId,
        status: 'active',
      },
    });
    if (!link) return NextResponse.json({ error: 'Aluno não vinculado' }, { status: 403 });

    const assigned = await prisma.assignedWorkout.create({
      data: {
        studentId,
        professorId: session.user.professorId,
        workoutName,
        startDate: startDate ? new Date(startDate) : new Date(),
        status: 'active',
        exercises: {
          create: (exercises ?? []).map((ex: any, i: number) => ({
            exerciseName: ex?.exerciseName ?? 'Exercício',
            sets: ex?.setsConfig?.length || ex?.sets || 3,
            reps: ex?.setsConfig?.[0]?.reps ?? ex?.reps ?? '12',
            suggestedWeight: ex?.setsConfig?.[0]?.weight ?? ex?.suggestedWeight ?? null,
            restTime: ex?.setsConfig?.[0]?.restTime ?? ex?.restTime ?? null,
            notes: ex?.notes ?? null,
            order: i,
            hasWarmup: ex?.hasWarmup ?? false,
            setsConfig: ex?.setsConfig ?? null,
            warmupConfig: ex?.hasWarmup && ex?.warmupConfig?.length > 0 ? ex.warmupConfig : null,
          })),
        },
      },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json(assigned, { status: 201 });
  } catch (error: any) {
    console.error('Assign workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
