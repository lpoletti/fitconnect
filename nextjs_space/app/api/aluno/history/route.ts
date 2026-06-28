export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const where: any = { studentId: session.user.studentId };
    if (from || to) {
      where.completedAt = {};
      if (from) where.completedAt.gte = new Date(from + 'T00:00:00');
      if (to) where.completedAt.lte = new Date(to + 'T23:59:59.999');
    }

    where.status = { in: ['completed', 'auto_completed'] };

    const logs = await prisma.workoutLog.findMany({
      where,
      include: {
        assignedWorkout: { select: { workoutName: true } },
        exerciseLogs: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    const totalCompleted = logs?.length ?? 0;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeek = (logs ?? []).filter((l: any) => new Date(l?.completedAt) >= weekStart)?.length ?? 0;

    return NextResponse.json({
      logs: (logs ?? []).map((l: any) => ({
        ...l,
        autoCompleted: l.status === 'auto_completed',
      })),
      stats: { totalCompleted, thisWeek },
    });
  } catch (error: any) {
    console.error('History error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
