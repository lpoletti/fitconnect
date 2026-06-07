export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, userType } = body ?? {};

    if (!email || !password || !name || !userType) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }
    if (!['professor', 'aluno'].includes(userType)) {
      return NextResponse.json({ error: 'Tipo de usuário inválido.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'Este email já está cadastrado.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        userType,
      },
    });

    if (userType === 'professor') {
      await prisma.professor.create({
        data: { userId: user.id, plan: 'free', maxStudents: 2 },
      });
    } else {
      const student = await prisma.student.create({
        data: { userId: user.id },
      });
      // Auto-link: check if any professor has a pending invite for this email
      const pendingLinks = await prisma.studentProfessorLink.findMany({
        where: { studentId: 'pending_' + normalizedEmail, status: 'pending' },
      });
      // We handle pending invites via a different mechanism - see invite endpoint
      // Check for pending invitations stored as placeholder links
      const invitations = await prisma.studentProfessorLink.findMany({
        where: { studentId: normalizedEmail, status: 'pending' },
      });
      for (const inv of invitations ?? []) {
        await prisma.studentProfessorLink.update({
          where: { id: inv.id },
          data: { studentId: student.id, status: 'active' },
        });
      }
    }

    return NextResponse.json({ message: 'Conta criada com sucesso!', userId: user.id }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 });
  }
}
