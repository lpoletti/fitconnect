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
    const { studentId, workoutName, startDate, exercises, workouts } = body ?? {};

    // Verify student is linked
    const link = await prisma.studentProfessorLink.findFirst({
      where: {
        studentId,
        professorId: session.user.professorId,
        status: 'active',
      },
    });
    if (!link) return NextResponse.json({ error: 'Aluno não vinculado' }, { status: 403 });

    // Support batch assignment (array of workouts) or single assignment
    const workoutList = workouts && Array.isArray(workouts) && workouts.length > 0
      ? workouts
      : [{ workoutName, startDate, exercises }];

    if (workoutList.some((w: any) => !w?.workoutName || !w?.exercises || w.exercises.length === 0)) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const results = [];
    for (const wk of workoutList) {
      const assigned = await prisma.assignedWorkout.create({
        data: {
          studentId,
          professorId: session.user.professorId,
          workoutName: wk.workoutName,
          startDate: wk.startDate ? new Date(wk.startDate) : new Date(),
          status: 'active',
          exercises: {
            create: (wk.exercises ?? []).map((ex: any, i: number) => ({
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
              mediaUrl: ex?.mediaUrl ?? null,
              mediaType: ex?.mediaType ?? null,
              mediaPath: ex?.mediaPath ?? null,
            })),
          },
        },
        include: { exercises: { orderBy: { order: 'asc' } } },
      });
      results.push(assigned);
    }

    return NextResponse.json(results.length === 1 ? results[0] : results, { status: 201 });
  } catch (error: any) {
    console.error('Assign workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
