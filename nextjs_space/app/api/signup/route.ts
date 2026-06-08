export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, userType, inviteCode } = body ?? {};

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
      // Generate unique invite code for professor
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 10) {
        const dup = await prisma.professor.findUnique({ where: { inviteCode: code } });
        if (!dup) break;
        code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        attempts++;
      }

      await prisma.professor.create({
        data: { userId: user.id, plan: 'free', maxStudents: 2, inviteCode: code },
      });
    } else {
      const student = await prisma.student.create({
        data: { userId: user.id },
      });

      // Auto-link via PendingInvite records (professor invited this email)
      const pendingInvites = await prisma.pendingInvite.findMany({
        where: { email: normalizedEmail },
      });
      for (const inv of pendingInvites) {
        // Check plan limit before creating link
        const activeCount = await prisma.studentProfessorLink.count({
          where: { professorId: inv.professorId, status: 'active' },
        });
        const prof = await prisma.professor.findUnique({ where: { id: inv.professorId } });
        const maxStudents = prof?.maxStudents ?? 2;
        if (activeCount < maxStudents) {
          await prisma.studentProfessorLink.create({
            data: {
              studentId: student.id,
              professorId: inv.professorId,
              status: 'active',
            },
          });
        }
      }
      // Delete all pending invites for this email
      if (pendingInvites.length > 0) {
        await prisma.pendingInvite.deleteMany({ where: { email: normalizedEmail } });
      }

      // Auto-link via invite code
      if (inviteCode) {
        const professor = await prisma.professor.findUnique({
          where: { inviteCode: inviteCode.toUpperCase().trim() },
        });
        if (professor) {
          // Check if not already linked via pending invite
          const existingLink = await prisma.studentProfessorLink.findUnique({
            where: {
              studentId_professorId: {
                studentId: student.id,
                professorId: professor.id,
              },
            },
          });
          if (!existingLink) {
            const activeCount = await prisma.studentProfessorLink.count({
              where: { professorId: professor.id, status: 'active' },
            });
            if (activeCount < (professor.maxStudents ?? 2)) {
              await prisma.studentProfessorLink.create({
                data: {
                  studentId: student.id,
                  professorId: professor.id,
                  status: 'active',
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ message: 'Conta criada com sucesso!', userId: user.id }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 });
  }
}
