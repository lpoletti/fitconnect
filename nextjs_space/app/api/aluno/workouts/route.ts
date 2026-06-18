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

    // Deep-clone exercises to ensure all Json fields are plain serializable objects
    const cleanExercises = JSON.parse(JSON.stringify(exercises));

    const workout = await prisma.assignedWorkout.create({
      data: {
        studentId: session.user.studentId,
        professorId: null,
        workoutName: workoutName.trim(),
        isPersonal: true,
        status: 'active',
        startDate: new Date(),
        exercises: {
          create: cleanExercises.map((ex: any, idx: number) => {
            const setsConfig = ex?.setsConfig && Array.isArray(ex.setsConfig) && ex.setsConfig.length > 0
              ? ex.setsConfig
              : null;
            const warmupConfig = ex?.warmupConfig && Array.isArray(ex.warmupConfig) && ex.warmupConfig.length > 0
              ? ex.warmupConfig
              : null;
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
              setsConfig: setsConfig,
              warmupConfig: warmupConfig,
              mediaUrl,
              mediaType,
              mediaPath,
              mediaFiles: mediaFiles,
            };
          }),
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
