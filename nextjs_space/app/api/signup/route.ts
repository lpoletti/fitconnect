export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signupSchema } from '@/lib/validations';
import { validateBody } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = validateBody(signupSchema, body);
    if ('error' in result) return result.error;
    const { email, password, name, userType, inviteCode } = result.data;

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'Este email já está cadastrado.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: name.trim(),
          passwordHash,
          userType,
        },
      });

      if (userType === 'professor') {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        let attempts = 0;
        while (attempts < 10) {
          const dup = await tx.professor.findUnique({ where: { inviteCode: code } });
          if (!dup) break;
          code = '';
          for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          attempts++;
        }
        await tx.professor.create({
          data: { userId: createdUser.id, plan: 'free', maxStudents: 2, inviteCode: code },
        });
      } else {
        const student = await tx.student.create({
          data: { userId: createdUser.id },
        });

        const pendingInvites = await tx.pendingInvite.findMany({
          where: { email: normalizedEmail },
        });
        for (const inv of pendingInvites) {
          const activeCount = await tx.studentProfessorLink.count({
            where: { professorId: inv.professorId, status: 'active' },
          });
          const prof = await tx.professor.findUnique({ where: { id: inv.professorId } });
          const maxStudents = prof?.maxStudents ?? 2;
          if (activeCount < maxStudents) {
            await tx.studentProfessorLink.create({
              data: {
                studentId: student.id,
                professorId: inv.professorId,
                status: 'active',
              },
            });
          }
        }
        if (pendingInvites.length > 0) {
          await tx.pendingInvite.deleteMany({ where: { email: normalizedEmail } });
        }

        if (inviteCode) {
          const professor = await tx.professor.findUnique({
            where: { inviteCode: inviteCode.toUpperCase().trim() },
          });
          if (professor) {
            const existingLink = await tx.studentProfessorLink.findUnique({
              where: {
                studentId_professorId: {
                  studentId: student.id,
                  professorId: professor.id,
                },
              },
            });
            if (!existingLink) {
              const activeCount = await tx.studentProfessorLink.count({
                where: { professorId: professor.id, status: 'active' },
              });
              if (activeCount < (professor.maxStudents ?? 2)) {
                await tx.studentProfessorLink.create({
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

      return createdUser;
    });

    return NextResponse.json({ message: 'Conta criada com sucesso!', userId: user.id }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 });
  }
}
