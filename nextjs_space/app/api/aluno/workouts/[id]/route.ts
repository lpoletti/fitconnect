export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const workout = await prisma.assignedWorkout.findFirst({
      where: { id: params?.id, studentId: session.user.studentId },
      include: {
        exercises: { orderBy: { order: 'asc' } },
        professor: { include: { user: { select: { name: true } } } },
      },
    });
    if (!workout) return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 });

    return NextResponse.json(workout);
  } catch (error: any) {
    console.error('Get workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - update personal workout
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const workout = await prisma.assignedWorkout.findFirst({
      where: { id: params?.id, studentId: session.user.studentId, isPersonal: true },
    });
    if (!workout) return NextResponse.json({ error: 'Treino não encontrado ou não é pessoal.' }, { status: 404 });

    const body = await request.json();
    const { name, category, description, exercises } = body ?? {};

    if (!name || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json({ error: 'Nome e exercícios são obrigatórios.' }, { status: 400 });
    }

    // Delete old exercises and recreate
    await prisma.assignedWorkoutExercise.deleteMany({ where: { assignedWorkoutId: params.id } });

    const updated = await prisma.assignedWorkout.update({
      where: { id: params.id },
      data: {
        workoutName: name.trim(),
        exercises: {
          create: exercises.map((ex: any, idx: number) => {
            const setsConfig = ex?.setsConfig && Array.isArray(ex.setsConfig) && ex.setsConfig.length > 0
              ? ex.setsConfig : null;
            const warmupConfig = ex?.warmupConfig && Array.isArray(ex.warmupConfig) && ex.warmupConfig.length > 0
              ? ex.warmupConfig : null;
            const sets = setsConfig ? setsConfig.length : (ex.sets ?? 3);
            const reps = setsConfig ? (setsConfig[0]?.reps ?? '12') : (ex.reps ?? '12');
            const suggestedWeight = setsConfig ? (setsConfig[0]?.weight ?? '') : (ex.suggestedWeight ?? '');
            const restTime = setsConfig ? (setsConfig[0]?.restTime ?? '60s') : (ex.restTime ?? '60s');

            const mediaFiles = ex?.mediaFiles && Array.isArray(ex.mediaFiles) && ex.mediaFiles.length > 0
              ? ex.mediaFiles : null;
            const mediaUrl = mediaFiles ? mediaFiles[0]?.url : (ex?.mediaUrl ?? null);
            const mediaType = mediaFiles ? mediaFiles[0]?.type : (ex?.mediaType ?? null);
            const mediaPath = mediaFiles ? mediaFiles[0]?.path : (ex?.mediaPath ?? null);

            return {
              exerciseName: ex.exerciseName?.trim() ?? '',
              sets,
              reps,
              suggestedWeight: suggestedWeight || null,
              restTime: restTime || '60s',
              notes: ex.notes ?? null,
              order: idx,
              hasWarmup: ex.hasWarmup ?? false,
              warmupSets: warmupConfig ? warmupConfig.length : null,
              warmupReps: warmupConfig ? (warmupConfig[0]?.reps ?? null) : null,
              warmupWeight: warmupConfig ? (warmupConfig[0]?.weight ?? null) : null,
              setsConfig: setsConfig ?? undefined,
              warmupConfig: warmupConfig ?? undefined,
              mediaUrl,
              mediaType,
              mediaPath,
              mediaFiles: mediaFiles ?? undefined,
            };
          }),
        },
      },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update personal workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PATCH - disable/enable workout
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const workout = await prisma.assignedWorkout.findFirst({
      where: { id: params?.id, studentId: session.user.studentId, isPersonal: true },
    });
    if (!workout) return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 });

    const body = await request.json();
    const newStatus = body?.status;
    if (!newStatus || !['active', 'inactive'].includes(newStatus)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    }

    const updated = await prisma.assignedWorkout.update({
      where: { id: params.id },
      data: { status: newStatus },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Patch workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - only if workout has never been used (no logs)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const workout = await prisma.assignedWorkout.findFirst({
      where: { id: params?.id, studentId: session.user.studentId, isPersonal: true },
      include: { _count: { select: { workoutLogs: true } } },
    });
    if (!workout) return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 });

    if (workout._count.workoutLogs > 0) {
      return NextResponse.json(
        { error: 'Este treino já foi utilizado e não pode ser excluído. Você pode desabilitá-lo.' },
        { status: 409 }
      );
    }

    await prisma.assignedWorkout.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
