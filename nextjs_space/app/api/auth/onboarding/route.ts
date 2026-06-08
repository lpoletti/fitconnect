export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

function generateInviteCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { userType, inviteCode } = body;

    if (!userType || !['professor', 'aluno'].includes(userType)) {
      return NextResponse.json({ error: 'Tipo de usuário inválido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // If user already has a type, don't allow changing
    if (user.userType) {
      return NextResponse.json({ error: 'Perfil já configurado' }, { status: 400 });
    }

    // Update user type
    await prisma.user.update({
      where: { id: user.id },
      data: { userType },
    });

    if (userType === 'professor') {
      // Create professor record
      let code = generateInviteCode();
      let attempts = 0;
      while (attempts < 10) {
        const exists = await prisma.professor.findUnique({ where: { inviteCode: code } });
        if (!exists) break;
        code = generateInviteCode();
        attempts++;
      }
      await prisma.professor.create({
        data: {
          userId: user.id,
          plan: 'free',
          maxStudents: 2,
          inviteCode: code,
        },
      });
    } else {
      // Create student record
      const student = await prisma.student.create({
        data: { userId: user.id },
      });

      // Check invite code or pending invite
      if (inviteCode) {
        const professor = await prisma.professor.findUnique({ where: { inviteCode: inviteCode.toUpperCase() } });
        if (professor) {
          await prisma.studentProfessorLink.create({
            data: {
              studentId: student.id,
              professorId: professor.id,
              status: 'active',
            },
          });
        }
      }

      // Check for pending invites by email
      const pendingInvites = await prisma.pendingInvite.findMany({
        where: { email: user.email.toLowerCase() },
      });
      for (const invite of pendingInvites) {
        const existingLink = await prisma.studentProfessorLink.findUnique({
          where: { studentId_professorId: { studentId: student.id, professorId: invite.professorId } },
        });
        if (!existingLink) {
          await prisma.studentProfessorLink.create({
            data: {
              studentId: student.id,
              professorId: invite.professorId,
              status: 'active',
            },
          });
        }
        await prisma.pendingInvite.delete({ where: { id: invite.id } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
