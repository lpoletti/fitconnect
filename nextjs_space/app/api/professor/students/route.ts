export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlanLimits } from '@/lib/plans';
import { sendNotificationEmail, buildEmailTemplate } from '@/lib/notifications';

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
    const planInfo = getPlanLimits(professor?.plan ?? 'free');
    if (activeCount >= planInfo.maxStudents) {
      return NextResponse.json({
        error: `Limite de ${planInfo.maxStudents} alunos ativos atingido no plano ${planInfo.name}. Faça upgrade para adicionar mais alunos.`,
        limitReached: true,
        plan: professor?.plan ?? 'free',
        maxStudents: planInfo.maxStudents,
      }, { status: 403 });
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

    // Student not registered yet - send invite email
    const professorName = session.user.name || 'Seu Professor';
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    sendNotificationEmail({
      notificationId: process.env.NOTIF_ID_CONVITE_PARA_ALUNO || '',
      recipientEmail: normalizedEmail,
      subject: `${professorName} convidou você para o FitConnect!`,
      htmlBody: buildEmailTemplate('Você foi convidado!', `
        <p style="color: #4b5563;">Olá!</p>
        <p style="color: #4b5563;"><strong>${professorName}</strong> convidou você para acompanhar seus treinos na plataforma FitConnect.</p>
        <p style="color: #4b5563;">Crie sua conta gratuita para começar:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/signup" style="background: #4f46e5; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Criar Minha Conta</a>
        </div>
        <p style="color: #9ca3af; font-size: 13px;">Use o email <strong>${normalizedEmail}</strong> para criar sua conta e ser vinculado automaticamente.</p>
      `),
    }).catch(() => {});

    return NextResponse.json({
      message: 'Convite enviado por email! O aluno precisa criar uma conta com este email para vincular automaticamente.',
      pending: true,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add student error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
