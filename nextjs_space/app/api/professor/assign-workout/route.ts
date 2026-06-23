export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendNotificationEmail, buildEmailTemplate } from '@/lib/notifications';
import { assignWorkoutSchema } from '@/lib/validations';
import { validateBody } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const result = validateBody(assignWorkoutSchema, body);
    if ('error' in result) return result.error;
    const { studentId, workouts, workoutName, startDate, exercises } = result.data;

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
      // Deep-clone exercises to ensure all Json fields are plain serializable objects
      const cleanExercises = JSON.parse(JSON.stringify(wk.exercises ?? []));

      const assigned = await prisma.assignedWorkout.create({
        data: {
          studentId,
          professorId: session.user.professorId,
          workoutName: wk.workoutName!,
          startDate: wk.startDate ? new Date(wk.startDate) : new Date(),
          status: 'active',
          exercises: {
            create: cleanExercises.map((ex: any, i: number) => ({
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
              mediaUrl: ex?.mediaFiles?.[0]?.url ?? ex?.mediaUrl ?? null,
              mediaType: ex?.mediaFiles?.[0]?.type ?? ex?.mediaType ?? null,
              mediaPath: ex?.mediaFiles?.[0]?.path ?? ex?.mediaPath ?? null,
              mediaFiles: ex?.mediaFiles?.length > 0 ? ex.mediaFiles : null,
            })),
          },
        },
        include: { exercises: { orderBy: { order: 'asc' } } },
      });
      results.push(assigned);
    }

    // Send notification email to student
    try {
      const studentLink = await prisma.studentProfessorLink.findFirst({
        where: { studentId, professorId: session.user.professorId },
        include: { student: { include: { user: { select: { email: true, name: true } } } } },
      });
      const studentEmail = studentLink?.student?.user?.email;
      if (studentEmail) {
        const workoutNames = workoutList.map((w: any) => w.workoutName).join(', ');
        const professorName = session.user.name || 'Seu Professor';
        sendNotificationEmail({
          notificationId: process.env.NOTIF_ID_NOVO_TREINO_ATRIBUDO || '',
          recipientEmail: studentEmail,
          subject: `Novo treino atribuído: ${workoutNames}`,
          htmlBody: buildEmailTemplate('Novo Treino!', `
            <p style="color: #4b5563;">Olá ${studentLink?.student?.user?.name || ''}!</p>
            <p style="color: #4b5563;"><strong>${professorName}</strong> atribuiu ${results.length > 1 ? 'novos treinos' : 'um novo treino'} para você:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="font-weight: bold; color: #1f2937; margin: 0;">${workoutNames}</p>
            </div>
            <p style="color: #4b5563;">Acesse a plataforma para ver os detalhes e começar a treinar!</p>
          `),
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Error sending workout notification:', e);
    }

    return NextResponse.json(results.length === 1 ? results[0] : results, { status: 201 });
  } catch (error: any) {
    console.error('Assign workout error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
