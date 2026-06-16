export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body ?? {};

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e senha sao obrigatorios.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no minimo 6 caracteres.' }, { status: 400 });
    }

    // Find the token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Token invalido ou expirado.' }, { status: 400 });
    }

    // Check expiration
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: 'Token invalido ou expirado.' }, { status: 400 });
    }

    const email = verificationToken.identifier;

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Delete the used token
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Erro ao redefinir senha. Tente novamente.' }, { status: 500 });
  }
}
