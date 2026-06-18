export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const original = await prisma.workoutTemplate.findFirst({
      where: { id: params?.id, professorId: session.user.professorId },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });
    if (!original) return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 });

    // Deep-clone to ensure all Json fields are plain serializable objects
    const cleanExercises = JSON.parse(JSON.stringify(original.exercises ?? []));

    const duplicate = await prisma.workoutTemplate.create({
      data: {
        professorId: session.user.professorId,
        name: `${original.name} (Cópia)`,
        category: original.category,
        description: original.description,
        exercises: {
          create: cleanExercises.map((ex: any) => ({
            exerciseName: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps,
            suggestedWeight: ex.suggestedWeight,
            restTime: ex.restTime,
            notes: ex.notes,
            order: ex.order,
            hasWarmup: ex.hasWarmup ?? false,
            setsConfig: ex.setsConfig ?? null,
            warmupConfig: ex.warmupConfig ?? null,
            mediaUrl: ex.mediaUrl ?? null,
            mediaType: ex.mediaType ?? null,
            mediaPath: ex.mediaPath ?? null,
            mediaFiles: ex.mediaFiles ?? null,
          })),
        },
      },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (error: any) {
    console.error('Duplicate workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
