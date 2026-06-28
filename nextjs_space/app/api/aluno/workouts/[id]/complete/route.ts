export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const body = await request.json();
    const { exerciseLogs, notes, logId } = body ?? {};

    const workout = await prisma.assignedWorkout.findFirst({
      where: { id: params?.id, studentId: session.user.studentId },
    });
    if (!workout) return NextResponse.json({ error: 'Treino nao encontrado' }, { status: 404 });

    if (logId) {
      const existing = await prisma.workoutLog.findFirst({
        where: { id: logId, studentId: session.user.studentId, status: 'in_progress' },
      });

      if (existing) {
        await prisma.exerciseLog.deleteMany({ where: { workoutLogId: logId } });

        await prisma.workoutLog.update({
          where: { id: logId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            notes: notes ?? null,
            exerciseLogs: {
              create: (exerciseLogs ?? []).map((el: any) => ({
                exerciseName: el?.exerciseName ?? '',
                setsCompleted: el?.setsCompleted ?? 0,
                repsCompleted: el?.repsCompleted ?? '0',
                weightUsed: el?.weightUsed ?? null,
                notes: el?.notes ?? null,
                warmupSetsCompleted: el?.warmupSetsCompleted ?? null,
                warmupRepsCompleted: el?.warmupRepsCompleted ?? null,
                warmupWeightUsed: el?.warmupWeightUsed ?? null,
                setsLog: el?.setsLog ?? null,
                warmupLog: el?.warmupLog ?? null,
              })),
            },
          },
          include: { exerciseLogs: true },
        });

        return NextResponse.json({ id: logId, status: 'completed' }, { status: 200 });
      }
    }

    const log = await prisma.workoutLog.create({
      data: {
        studentId: session.user.studentId,
        assignedWorkoutId: params.id,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        notes: notes ?? null,
        exerciseLogs: {
          create: (exerciseLogs ?? []).map((el: any) => ({
            exerciseName: el?.exerciseName ?? '',
            setsCompleted: el?.setsCompleted ?? 0,
            repsCompleted: el?.repsCompleted ?? '0',
            weightUsed: el?.weightUsed ?? null,
            notes: el?.notes ?? null,
            warmupSetsCompleted: el?.warmupSetsCompleted ?? null,
            warmupRepsCompleted: el?.warmupRepsCompleted ?? null,
            warmupWeightUsed: el?.warmupWeightUsed ?? null,
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
