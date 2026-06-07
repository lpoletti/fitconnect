export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const professor = await prisma.professor.findUnique({
      where: { id: session.user.professorId },
    });

    const workoutCount = await prisma.workoutTemplate.count({
      where: { professorId: session.user.professorId },
    });

    return NextResponse.json({
      plan: professor?.plan ?? 'free',
      maxStudents: professor?.maxStudents ?? 2,
      workoutCount,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
