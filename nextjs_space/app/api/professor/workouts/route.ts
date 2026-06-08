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
          create: (exercises ?? []).map((ex: any, i: number) => {
            const sc = ex?.setsConfig ?? [];
            return {
              exerciseName: ex?.exerciseName ?? 'Exercício',
              sets: sc.length || ex?.sets || 3,
              reps: sc[0]?.reps ?? ex?.reps ?? '12',
              suggestedWeight: sc[0]?.weight ?? ex?.suggestedWeight ?? null,
              restTime: sc[0]?.restTime ?? ex?.restTime ?? null,
              notes: ex?.notes ?? null,
              order: i,
              hasWarmup: ex?.hasWarmup ?? false,
              setsConfig: sc.length > 0 ? sc : null,
              warmupConfig: ex?.hasWarmup && ex?.warmupConfig?.length > 0 ? ex.warmupConfig : null,
              mediaUrl: ex?.mediaFiles?.[0]?.url ?? ex?.mediaUrl ?? null,
              mediaType: ex?.mediaFiles?.[0]?.type ?? ex?.mediaType ?? null,
              mediaPath: ex?.mediaFiles?.[0]?.path ?? ex?.mediaPath ?? null,
              mediaFiles: ex?.mediaFiles?.length > 0 ? ex.mediaFiles : null,
            };
          }),
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
