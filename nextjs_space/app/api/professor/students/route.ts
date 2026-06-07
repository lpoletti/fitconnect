export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const links = await prisma.studentProfessorLink.findMany({
      where: { professorId: session.user.professorId },
      include: {
        student: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(links ?? []);
  } catch (error: any) {
    console.error('Students error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { email } = body ?? {};
    if (!email) return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();

    // Check limit
    const activeCount = await prisma.studentProfessorLink.count({
      where: { professorId: session.user.professorId, status: 'active' },
    });
    const professor = await prisma.professor.findUnique({
      where: { id: session.user.professorId },
    });
    if (activeCount >= (professor?.maxStudents ?? 2)) {
      return NextResponse.json({ error: 'Limite de alunos ativos atingido no plano gratuito.' }, { status: 403 });
    }

    // Check if student already exists
    const studentUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { student: true },
    });

    if (studentUser?.student) {
      // Check if link already exists
      const existingLink = await prisma.studentProfessorLink.findUnique({
        where: {
          studentId_professorId: {
            studentId: studentUser.student.id,
            professorId: session.user.professorId,
          },
        },
      });
      if (existingLink) {
        if (existingLink.status === 'inactive') {
          await prisma.studentProfessorLink.update({
            where: { id: existingLink.id },
            data: { status: 'active' },
          });
          return NextResponse.json({ message: 'Vínculo reativado com sucesso!' });
        }
        return NextResponse.json({ error: 'Aluno já está vinculado.' }, { status: 409 });
      }
      // Create active link directly
      await prisma.studentProfessorLink.create({
        data: {
          studentId: studentUser.student.id,
          professorId: session.user.professorId,
          status: 'active',
        },
      });
      return NextResponse.json({ message: 'Aluno vinculado com sucesso!' }, { status: 201 });
    }

    // Student not registered yet - we can't create a real link, store invite
    // For MVP: return message that student needs to create account first
    return NextResponse.json({
      message: 'Convite registrado! O aluno precisa criar uma conta com este email para vincular automaticamente.',
      pending: true,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add student error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
