export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const invite = await prisma.pendingInvite.findUnique({
      where: { id: params.id },
    });

    if (!invite || invite.professorId !== session.user.professorId) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
    }

    await prisma.pendingInvite.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Convite cancelado.' });
  } catch (error: any) {
    console.error('Delete invite error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
