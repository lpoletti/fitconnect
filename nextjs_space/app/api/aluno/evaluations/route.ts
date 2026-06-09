export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const evaluations = await prisma.studentEvaluation.findMany({
      where: { studentId: session.user.studentId },
      include: {
        professor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(evaluations);
  } catch (error: any) {
    console.error('Student evaluations error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
