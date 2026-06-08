export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { workoutName, exercises } = body ?? {};

    if (!workoutName || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json({ error: 'Nome e exercícios são obrigatórios.' }, { status: 400 });
    }

    const workout = await prisma.assignedWorkout.create({
      data: {
        studentId: session.user.studentId,
        professorId: null,
        workoutName: workoutName.trim(),
        isPersonal: true,
        status: 'active',
        startDate: new Date(),
        exercises: {
          create: exercises.map((ex: any, idx: number) => ({
            exerciseName: ex.exerciseName?.trim() ?? '',
            sets: ex.sets ?? 3,
            reps: ex.reps ?? '12',
            restTime: ex.restTime ?? '60s',
            notes: ex.notes ?? null,
            order: idx,
          })),
        },
      },
      include: { exercises: true },
    });

    return NextResponse.json(workout, { status: 201 });
  } catch (error: any) {
    console.error('Create personal workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
