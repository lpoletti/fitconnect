export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const studentId = session.user.studentId;

    // Get professor link
    const link = await prisma.studentProfessorLink.findFirst({
      where: { studentId, status: 'active' },
      include: {
        professor: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    // Get all workouts (active + inactive, both professor-assigned and personal)
    const workouts = await prisma.assignedWorkout.findMany({
      where: { studentId, status: { in: ['active', 'inactive'] } },
      include: {
        exercises: { orderBy: { order: 'asc' } },
        professor: { include: { user: { select: { name: true } } } },
        _count: { select: { workoutLogs: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    // Get recent logs
    const recentLogs = await prisma.workoutLog.findMany({
      where: { studentId },
      include: {
        assignedWorkout: { select: { workoutName: true } },
        exerciseLogs: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    });

    // Total completed
    const totalCompleted = await prisma.workoutLog.count({
      where: { studentId },
    });

    return NextResponse.json({
      professor: link ? {
        name: link.professor?.user?.name ?? 'Professor',
        specialty: link.professor?.specialty ?? 'Personal Trainer',
      } : null,
      workouts: workouts ?? [],
      recentLogs: recentLogs ?? [],
      totalCompleted,
    });
  } catch (error: any) {
    console.error('Student dashboard error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
