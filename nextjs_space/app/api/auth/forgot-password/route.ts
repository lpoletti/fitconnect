export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendNotificationEmail, buildEmailTemplate } from '@/lib/notifications';
import { forgotPasswordSchema } from '@/lib/validations';
import { validateBody } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = validateBody(forgotPasswordSchema, body);
    if ('error' in result) return result.error;
    const { email } = result.data;

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'Se o email estiver cadastrado, voce recebera um link de recuperacao.' });
    }

    // Google SSO users without password cannot reset
    if (!user.passwordHash) {
      return NextResponse.json({ message: 'Se o email estiver cadastrado, voce recebera um link de recuperacao.' });
    }

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });

    // Generate reset token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    });

    // Build reset URL
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // Send email
    const htmlBody = buildEmailTemplate(
      'Recuperacao de Senha',
      `
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Ola,
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Recebemos uma solicitacao para redefinir a senha da sua conta no FitConnect.
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Clique no botao abaixo para criar uma nova senha:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Redefinir Senha
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          Se voce nao solicitou a mudanca de senha, ignore este email. O link expira em 1 hora.
        </p>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          Link direto: <a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a>
        </p>
      `
    );

    await sendNotificationEmail({
      notificationId: `password-reset-${token}`,
      recipientEmail: normalizedEmail,
      subject: 'FitConnect — Recuperacao de Senha',
      htmlBody,
    });

    return NextResponse.json({ message: 'Se o email estiver cadastrado, voce recebera um link de recuperacao.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Erro ao processar solicitacao. Tente novamente.' }, { status: 500 });
  }
}
