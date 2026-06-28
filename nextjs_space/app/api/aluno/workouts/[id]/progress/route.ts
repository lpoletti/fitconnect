export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const body = await request.json();
    const { logId, exerciseLogs, notes } = body ?? {};

    if (!logId) return NextResponse.json({ error: 'logId obrigatorio' }, { status: 400 });

    const log = await prisma.workoutLog.findFirst({
      where: { id: logId, studentId: session.user.studentId, status: 'in_progress' },
    });
    if (!log) return NextResponse.json({ error: 'Log nao encontrado ou treino nao esta em andamento' }, { status: 404 });

    const currentExerciseLogs = await prisma.exerciseLog.findMany({
      where: { workoutLogId: logId },
    });

    const incoming = (exerciseLogs ?? []).map((el: any) => ({
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
    }));

    const toCreate = incoming.filter(
      (inc: any) => !currentExerciseLogs.some((cur: any) => cur.exerciseName === inc.exerciseName)
    );
    const toUpdate = incoming.filter(
      (inc: any) => currentExerciseLogs.some((cur: any) => cur.exerciseName === inc.exerciseName)
    );

    await prisma.$transaction(async (tx: any) => {
      if (toCreate.length > 0) {
        await tx.exerciseLog.createMany({
          data: toCreate.map((el: any) => ({ ...el, workoutLogId: logId })),
          skipDuplicates: true,
        });
      }

      for (const el of toUpdate) {
        const existing = currentExerciseLogs.find((cur: any) => cur.exerciseName === el.exerciseName);
        if (existing) {
          await tx.exerciseLog.update({
            where: { id: existing.id },
            data: {
              setsCompleted: el.setsCompleted,
              repsCompleted: el.repsCompleted,
              weightUsed: el.weightUsed,
              notes: el.notes,
              warmupSetsCompleted: el.warmupSetsCompleted,
              warmupRepsCompleted: el.warmupRepsCompleted,
              warmupWeightUsed: el.warmupWeightUsed,
              setsLog: el.setsLog,
              warmupLog: el.warmupLog,
            },
          });
        }
      }

      if (notes !== undefined) {
        await tx.workoutLog.update({
          where: { id: logId },
          data: { notes: notes ?? null },
        });
      }
    });

    return NextResponse.json({ saved: true });
  } catch (error: any) {
    console.error('Update progress error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
