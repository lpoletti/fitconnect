export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const workouts = await prisma.workoutTemplate.findMany({
      where: { professorId: session.user.professorId },
      include: { exercises: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(workouts ?? []);
  } catch (error: any) {
    console.error('Workouts error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { name, category, description, exercises } = body ?? {};
    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

    const workout = await prisma.workoutTemplate.create({
      data: {
        professorId: session.user.professorId,
        name,
        category: category ?? null,
        description: description ?? null,
        exercises: {
          create: (exercises ?? []).map((ex: any, i: number) => ({
            exerciseName: ex?.exerciseName ?? 'Exercício',
            sets: ex?.sets ?? 3,
            reps: ex?.reps ?? '12',
            suggestedWeight: ex?.suggestedWeight ?? null,
            restTime: ex?.restTime ?? null,
            notes: ex?.notes ?? null,
            order: i,
          })),
        },
      },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json(workout, { status: 201 });
  } catch (error: any) {
    console.error('Create workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
