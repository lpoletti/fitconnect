export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { linkProfessorSchema } from '@/lib/validations';
import { validateBody } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const result = validateBody(linkProfessorSchema, body);
    if ('error' in result) return result.error;
    const { inviteCode } = result.data;

    const code = inviteCode.toUpperCase().trim();

    // Find professor by invite code
    const professor = await prisma.professor.findUnique({
      where: { inviteCode: code },
      include: { user: { select: { name: true } } },
    });

    if (!professor) {
      return NextResponse.json({ error: 'Código de convite inválido. Verifique com seu professor.' }, { status: 404 });
    }

    // Check if link already exists
    const existingLink = await prisma.studentProfessorLink.findUnique({
      where: {
        studentId_professorId: {
          studentId: session.user.studentId,
          professorId: professor.id,
        },
      },
    });

    if (existingLink) {
      if (existingLink.status === 'active') {
        return NextResponse.json({ error: 'Você já está vinculado a este professor.' }, { status: 409 });
      }
      // Reactivate inactive link
      await prisma.studentProfessorLink.update({
        where: { id: existingLink.id },
        data: { status: 'active' },
      });
      return NextResponse.json({
        message: `Vínculo com ${professor.user?.name ?? 'professor'} reativado com sucesso!`,
        professorName: professor.user?.name ?? 'Professor',
      });
    }

    // Check professor's plan limit
    const activeCount = await prisma.studentProfessorLink.count({
      where: { professorId: professor.id, status: 'active' },
    });
    if (activeCount >= (professor.maxStudents ?? 2)) {
      return NextResponse.json({
        error: 'Este professor atingiu o limite de alunos do plano atual. Entre em contato com ele.',
      }, { status: 403 });
    }

    // Create link
    await prisma.studentProfessorLink.create({
      data: {
        studentId: session.user.studentId,
        professorId: professor.id,
        status: 'active',
      },
    });

    // Remove any pending invite for this student's email from this professor
    const studentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (studentUser?.email) {
      await prisma.pendingInvite.deleteMany({
        where: {
          email: studentUser.email,
          professorId: professor.id,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      message: `Vinculado com sucesso ao professor ${professor.user?.name ?? ''}!`,
      professorName: professor.user?.name ?? 'Professor',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Link professor error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
