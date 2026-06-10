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
