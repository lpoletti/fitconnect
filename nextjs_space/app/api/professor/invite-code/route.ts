export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let professor = await prisma.professor.findUnique({
      where: { id: session.user.professorId },
    });

    // Generate code if not exists
    if (!professor?.inviteCode) {
      let code = generateCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.professor.findUnique({ where: { inviteCode: code } });
        if (!existing) break;
        code = generateCode();
        attempts++;
      }
      professor = await prisma.professor.update({
        where: { id: session.user.professorId },
        data: { inviteCode: code },
      });
    }

    return NextResponse.json({ inviteCode: professor?.inviteCode ?? '' });
  } catch (error: any) {
    console.error('Invite code error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
